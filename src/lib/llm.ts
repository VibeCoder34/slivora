import OpenAI from 'openai';
import { env } from './env';
import { SlidePlan, SlidePlanSchema, GenerateRequest } from '../types/slide-plan';
import fetch from 'node-fetch';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

/**
 * System prompt for SlideSmith - the presentation architect
 */
const SYSTEM_PROMPT = `You are SlideSmith, an expert presentation architect. Given a project title, language, and outline, return a normalized JSON SlidePlan.

Key requirements:
- Each slide MUST have a unique "id" field (e.g., "slide-1", "slide-2", etc.)
- Titles must be ≤ 60 characters
- Bullets must be ≤ 120 characters each
- Maximum 6 bullets per slide
- Return pure JSON only — no code fences or markdown
- Include 8–12 slides unless outline forces fewer
- Add section divider slides if useful for structure
- Use appropriate layouts: "title", "title-bullets", "section", "quote"
- Ensure bullets are provided for "title-bullets" layout
- Make content engaging and professional

References requirements:
- Add a final slide titled "References" listing credible sources used
- Also populate a top-level "references" array with { url, label? } for each source
- Prefer authoritative sources (e.g., .gov, .edu, reputable journals, official docs)

Return ONLY valid JSON of type SlidePlan with keys: projectTitle, language, slides[], references?[]. Each slide must have: id, title, bullets (optional), speakerNotes (optional), layout (optional).`;

/**
 * Generate user prompt from request parameters
 */
function createUserPrompt(title: string, language: string, outline: string): string {
  return `Project Title: "${title}"
Language: ${language}
Presentation Outline (bullets):
${outline}

IMPORTANT formatting:
- Each slide must have a unique "id" field (e.g., "slide-1", "slide-2", etc.)
- Include a final "References" slide with bullet points as source titles
- Include a top-level references array with URLs and optional labels
`;
}

/**
 * Extract JSON from OpenAI response text
 * Handles cases where response might be wrapped in code fences or have extra text
 */
function extractJsonFromResponse(text: string): string {
  // First, try to find JSON object boundaries
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  
  if (jsonStart === -1 || jsonEnd === -1 || jsonStart >= jsonEnd) {
    throw new Error('No valid JSON object found in response');
  }
  
  return text.substring(jsonStart, jsonEnd + 1);
}

/**
 * Attempt to repair invalid JSON with a follow-up prompt
 */
async function repairJson(
  originalPrompt: string,
  invalidJson: string,
  error: string
): Promise<SlidePlan> {
  const repairPrompt = `The previous response had invalid JSON. Please fix it.

Original request:
${originalPrompt}

Invalid JSON:
${invalidJson}

Error: ${error}

Please return ONLY the corrected JSON object.`;

  try {
    const repairResponse = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: repairPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const repairText = repairResponse.choices[0]?.message?.content;
    if (!repairText) {
      throw new Error('No response from repair attempt');
    }

    const repairedJson = extractJsonFromResponse(repairText);
    const parsed = JSON.parse(repairedJson);
    
    // Ensure each slide has an ID
    if (parsed.slides && Array.isArray(parsed.slides)) {
      parsed.slides = parsed.slides.map((slide: unknown, index: number) => ({
        ...slide,
        id: slide.id || `slide-${index + 1}`
      }));
    }
    
    return SlidePlanSchema.parse(parsed);
  } catch (repairError) {
    throw new Error(`JSON repair failed: ${repairError instanceof Error ? repairError.message : 'Unknown error'}`);
  }
}

/**
 * Generate a slide plan using OpenAI
 * @param params - Generation parameters
 * @returns Validated SlidePlan
 */
export async function generateSlidePlan({
  title,
  language,
  outline,
}: GenerateRequest): Promise<SlidePlan> {
  let response: unknown = null;
  
  try {
    const userPrompt = createUserPrompt(title, language, outline);
    
    response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      // Use JSON mode if available (OpenAI API v1.1+)
      ...(env.OPENAI_MODEL.includes('gpt-4') && {
        response_format: { type: 'json_object' },
      }),
    });

    const responseText = response.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Extract and parse JSON
    console.log('Raw OpenAI response:', responseText);
    const jsonText = extractJsonFromResponse(responseText);
    console.log('Extracted JSON text:', jsonText);
    
    const parsed = JSON.parse(jsonText);
    console.log('Parsed JSON:', parsed);

    // Ensure each slide has an ID
    if (parsed.slides && Array.isArray(parsed.slides)) {
      parsed.slides = parsed.slides.map((slide: unknown, index: number) => ({
        ...slide,
        id: slide.id || `slide-${index + 1}`
      }));
    }

    // Validate with Zod schema
    console.log('Validating with Zod schema...');
    const validatedPlan = SlidePlanSchema.parse(parsed);
    console.log('Zod validation successful:', validatedPlan);
    
    // Second-pass verification/refinement to reduce factual errors
    const refined = await verifyAndRefineSlidePlan(validatedPlan);
    return refined;
  } catch (error) {
    console.error('generateSlidePlan error:', error);
    
    // If it's a Zod validation error, try to repair the JSON
    if (error instanceof Error && error.message.includes('validation') && response) {
      try {
        const responseText = response.choices[0]?.message?.content || '';
        return await repairJson(
          createUserPrompt(title, language, outline),
          responseText,
          error.message
        );
      } catch (repairError) {
        console.error('JSON repair failed:', repairError);
        throw new Error(`Failed to generate valid slide plan: ${repairError instanceof Error ? repairError.message : 'Unknown error'}`);
      }
    }

    // Handle specific error cases with better messages
    if (error instanceof Error) {
      if (error.message.includes('No response from OpenAI')) {
        throw new Error('AI service is temporarily unavailable. Please try again in a few moments.');
      } else if (error.message.includes('rate limit')) {
        throw new Error('Too many requests. Please wait a moment before trying again.');
      } else if (error.message.includes('insufficient_quota')) {
        throw new Error('AI service quota exceeded. Please try again later.');
      } else if (error.message.includes('timeout')) {
        throw new Error('Request timed out. Please try again.');
      }
    }

    // Re-throw other errors with a generic message
    throw new Error(`Failed to generate presentation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify and refine the slide plan:
 * - Ensure factual consistency
 * - Remove/adjust dubious claims
 * - Ensure references are aligned and include authoritative URLs
 */
async function verifyAndRefineSlidePlan(plan: SlidePlan): Promise<SlidePlan> {
  try {
    const instruction = `You are a rigorous fact-checker. Review the provided SlidePlan JSON.
Goals:
- Identify and correct factual inaccuracies or unverified claims.
- Keep persuasive or stylistic text, but adjust facts to be accurate.
- Ensure a final slide titled "References" exists with 5–10 credible sources where possible.
- Ensure top-level references[] contains canonical URLs and optional labels.
- Return ONLY corrected JSON in the same schema.`;

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: 'system', content: instruction },
        { role: 'user', content: JSON.stringify(plan) },
      ],
      temperature: 0.2,
      max_tokens: 4000,
      ...(env.OPENAI_MODEL.includes('gpt-4') && {
        response_format: { type: 'json_object' },
      }),
    });

    const content = response.choices[0]?.message?.content || '';
    const fixedJson = extractJsonFromResponse(content);
    const parsed = JSON.parse(fixedJson);

    // Ensure slide IDs remain present after refinement
    if (parsed.slides && Array.isArray(parsed.slides)) {
      parsed.slides = parsed.slides.map((slide: unknown, index: number) => ({
        ...slide,
        id: slide.id || `slide-${index + 1}`,
      }));
    }

    return SlidePlanSchema.parse(parsed);
  } catch (err) {
    console.warn('verifyAndRefineSlidePlan failed, returning original plan:', err);
    return plan;
  }
}

/**
 * Generate a comment about the project topic
 * @param params - Comment generation parameters
 * @returns Generated comment string
 */
export async function generateTopicComment({
  title,
  language,
  outline,
}: GenerateRequest): Promise<string> {
  try {
    const userPrompt = `Project Title: "${title}"
Language: ${language}
Presentation Outline:
${outline}

Please provide a brief, insightful comment about this topic. The comment should be:
- 2-3 sentences long
- Professional and engaging
- Relevant to the topic and outline
- Written in ${language === 'en' ? 'English' : language}
- Focus on why this topic is important or interesting

Comment:`;

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert presentation consultant. Provide brief, insightful comments about presentation topics that highlight their importance and relevance.' 
        },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const comment = response.choices[0]?.message?.content;
    if (!comment) {
      throw new Error('No comment generated from OpenAI');
    }

    return comment.trim();
  } catch (error) {
    console.error('Error generating topic comment:', error);
    throw new Error(`Failed to generate comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Test the OpenAI connection
 * @returns True if connection is successful
 */
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 10,
    });
    return true;
  } catch (error) {
    console.error('OpenAI connection test failed:', error);
    return false;
  }
}

export interface StudyNotes {
  markdown: string;
  quiz?: { question: string; options?: string[]; answer?: string }[];
}

export async function generateStudyNotes(plan: SlidePlan, language: string): Promise<StudyNotes> {
  const prompt = `Create concise study notes in Markdown derived strictly from the following SlidePlan JSON.
Requirements:
- Use clear, structured bullet points.
- Include key concepts & definitions.
- Provide a 1-2 sentence summary for each slide.
- Add short extra insights/examples only if relevant.
- At the end, include 3 sample quiz questions.
- Write in ${language}.

Return ONLY Markdown text for the notes, followed by a JSON block with 3 quiz questions in the format { question, answer }.

SlidePlan JSON:\n${JSON.stringify(plan)}`;

  const response = await openai.chat.completions.create({
    model: env.OPENAI_MODEL,
    messages: [
      { role: 'system', content: 'You are an expert study coach creating accurate, concise study notes.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 2000,
  });
  const text = response.choices[0]?.message?.content || '';

  // Heuristically split markdown and JSON quiz at the last JSON block if present
  let markdown = text.trim();
  let quiz: { question: string; options?: string[]; answer?: string }[] | undefined;
  try {
    const jsonStart = text.lastIndexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      const jsonChunk = text.slice(jsonStart, jsonEnd + 1);
      const parsed = JSON.parse(jsonChunk);
      if (Array.isArray(parsed?.questions)) {
        quiz = parsed.questions;
        markdown = text.slice(0, jsonStart).trim();
      }
    }
  } catch {
    // ignore parsing errors and return markdown only
  }

  return { markdown, quiz };
}
