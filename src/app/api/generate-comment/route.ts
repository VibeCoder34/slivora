import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateTopicComment } from '@/lib/llm';

// Request validation schema
const CommentRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  language: z.string().min(1, 'Language is required'),
  outline: z.string().min(1, 'Outline is required'),
});

type CommentRequest = z.infer<typeof CommentRequestSchema>;

interface ErrorResponse {
  error: string;
  issues?: string[];
}

/**
 * POST /api/generate-comment
 * Generate a comment about the project topic using OpenAI
 */
export async function POST(request: NextRequest) {
  try {
    console.log('=== COMMENT GENERATION API ROUTE CALLED ===');
    
    // Parse and validate request body
    const body = await request.json();
    console.log('Received request body:', body);
    
    const validationResult = CommentRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.log('Validation errors:', validationResult.error.errors);
      const errorResponse: ErrorResponse = {
        error: 'Validation error',
        issues: validationResult.error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
      };
      console.log('Returning validation error:', errorResponse);
      return NextResponse.json(errorResponse, { status: 422 });
    }
    
    const { title, language, outline } = validationResult.data;
    
    console.log('Generating comment for:', { title, language });
    
    // Generate comment using OpenAI
    const comment = await generateTopicComment({ title, language, outline });
    console.log('Comment generated successfully');
    
    return NextResponse.json({
      comment,
      success: true,
    });
    
  } catch (error) {
    console.error('Comment generation API error:', error);
    
    const errorResponse: ErrorResponse = {
      error: error instanceof Error ? error.message : 'Internal server error',
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
