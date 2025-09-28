import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { generateSlidePlan } from '@/lib/llm';
import { hitRateLimit } from '@/lib/rateLimit';
import { GenerateRequestSchema, formatValidationErrors, ErrorResponse } from '@/types/slide-plan';

// Rate limiting configuration
const GENERATE_RATE_LIMIT = {
  limit: 5,
  windowMs: 10 * 60 * 1000, // 10 minutes
};

/**
 * Get client IP address from request headers
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  return 'anon';
}

/**
 * POST /api/generate
 * Generate a slide plan from title, language, and outline
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = GenerateRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errorResponse: ErrorResponse = {
        error: 'Validation error',
        issues: formatValidationErrors(validationResult.error),
      };
      return NextResponse.json(errorResponse, { status: 422 });
    }
    
    const { title, language, outline } = validationResult.data;
    
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    const rateLimitKey = `gen:${clientIP}`;
    
    // Check rate limit
    const rateLimitResult = hitRateLimit(
      rateLimitKey,
      GENERATE_RATE_LIMIT.limit,
      GENERATE_RATE_LIMIT.windowMs
    );
    
    if (!rateLimitResult.ok) {
      const errorResponse: ErrorResponse = {
        error: 'Rate limit exceeded',
        retryAfterSeconds: rateLimitResult.retryAfter,
      };
      return NextResponse.json(errorResponse, { status: 429 });
    }
    
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      const errorResponse: ErrorResponse = {
        error: 'Authentication required',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }
    
    // Generate slide plan using LLM
    const slidePlan = await generateSlidePlan({ title, language, outline });
    
    // Store the project in Supabase
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title: slidePlan.projectTitle,
        outline_text: outline,
        language: slidePlan.language,
        slide_count: slidePlan.slides.length,
        slide_plan: slidePlan, // Store the complete slide plan as JSONB
      })
      .select()
      .single();
    
    if (projectError) {
      console.error('Failed to save project:', projectError);
      const errorResponse: ErrorResponse = {
        error: 'Failed to save project',
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }
    
    // Store individual slides
    const slidesData = slidePlan.slides.map((slide, index) => ({
      project_id: project.id,
      slide_number: index + 1,
      content: JSON.stringify({
        id: slide.id,
        title: slide.title,
        bullets: slide.bullets,
        speakerNotes: slide.speakerNotes,
        layout: slide.layout,
      }),
    }));
    
    const { error: slidesError } = await supabase
      .from('slides')
      .insert(slidesData);
    
    if (slidesError) {
      console.error('Failed to save slides:', slidesError);
      // Don't fail the request, just log the error
    }
    
    // Return the slide plan with project ID
    return NextResponse.json({
      ...slidePlan,
      projectId: project.id,
      remaining: rateLimitResult.remaining,
    });
    
  } catch (error) {
    console.error('Generate API error:', error);
    
    const errorResponse: ErrorResponse = {
      error: error instanceof Error ? error.message : 'Internal server error',
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
