import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateSlidePlan } from '@/lib/llm';
import { hitRateLimit } from '@/lib/rateLimit';
import { GenerateRequestSchema, formatValidationErrors, ErrorResponse } from '@/types/slide-plan';
import { checkUserTokens, deductTokens } from '@/lib/token-system';
import { isThemeAvailableForPlan, SubscriptionPlan } from '@/lib/config/pricing';

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
 * POST /api/projects/create-and-generate
 * Create a new project and immediately generate AI slides
 */
export async function POST(request: NextRequest) {
  console.log('=== API ROUTE CALLED ===');
  
  try {
    console.log('API route called');
    
    // Check environment variables
    console.log('Checking environment variables...');
    console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
    console.log('SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Parse and validate request body
    const body = await request.json();
    console.log('Received request body:', body);
    
    const validationResult = GenerateRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.log('Validation errors:', validationResult.error.errors);
      console.log('Request body that failed validation:', body);
      console.log('Field values:', {
        title: body.title,
        language: body.language,
        outline: body.outline
      });
      console.log('Field types:', {
        title: typeof body.title,
        language: typeof body.language,
        outline: typeof body.outline
      });
      const errorResponse: ErrorResponse = {
        error: 'Validation error',
        issues: formatValidationErrors(validationResult.error),
      };
      console.log('Returning validation error:', errorResponse);
      return NextResponse.json(errorResponse, { status: 422 });
    }
    
    const { title, language, outline, theme } = validationResult.data;
    
    // Get authenticated user
    console.log('Creating Supabase client...');
    const supabase = await createClient();
    console.log('Supabase client created');
    
    console.log('Getting user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('User data:', { user: user?.id, authError });
    console.log('User email:', user?.email);
    console.log('Auth error details:', authError);
    
    if (authError || !user) {
      console.log('Authentication failed');
      console.log('Auth error:', authError);
      console.log('User:', user);
      const errorResponse: ErrorResponse = {
        error: 'Unauthorized',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }
    
    // Check if user has enough tokens for creating a presentation
    const tokenCheck = await checkUserTokens(user.id, 'create_presentation');
    if (!tokenCheck.hasEnoughTokens) {
      return NextResponse.json({
        error: 'Insufficient tokens',
        message: tokenCheck.message,
        currentPlan: tokenCheck.currentPlan,
        availableTokens: tokenCheck.availableTokens,
        requiredTokens: tokenCheck.requiredTokens,
      }, { status: 402 }); // 402 Payment Required
    }

    // Validate theme availability for user's plan
    const userPlan = tokenCheck.currentPlan as SubscriptionPlan;
    if (!isThemeAvailableForPlan(theme || 'minimal', userPlan)) {
      return NextResponse.json({
        error: 'Theme not available',
        message: `The selected theme is not available for your current plan (${userPlan}). Please upgrade to access all themes.`,
        currentPlan: userPlan,
      }, { status: 403 }); // 403 Forbidden
    }
    
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    const rateLimitKey = `gen:${user.id}`;
    
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
    
    // Insert project with basic fields
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title,
        outline_text: outline,
        language,
        theme: theme || 'minimal',
        slide_count: 0,
        status: 'generating', // Set status to generating
      })
      .select()
      .single();
    
    if (projectError) {
      console.error('Failed to create project:', projectError);
      const errorResponse: ErrorResponse = {
        error: 'Failed to create project',
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }
    
    try {
      // Generate slide plan using LLM
      console.log('Starting AI generation...');
      console.log('Generation parameters:', { title, language, outline });
      
      const slidePlan = await generateSlidePlan({ title, language, outline });
      console.log('AI generation completed successfully');
      console.log('Generated slide plan:', slidePlan);
      
      // Try to update project with slide plan (if column exists)
      let updatedProject = project;
      let updateError = null;
      
      try {
        const { data: updateData, error: updateErr } = await supabase
          .from('projects')
          .update({
            slide_count: slidePlan.slides.length,
            slide_plan: slidePlan, // Store the complete slide plan
            status: 'ready',
            slides_count: slidePlan.slides.length,
            last_generated_at: new Date().toISOString(),
            generate_error: null,
          })
          .eq('id', project.id)
          .select()
          .single();
        
        if (updateErr) {
          console.log('Slide plan column might not exist, falling back to individual slides:', updateErr.message);
          updateError = updateErr;
        } else {
          updatedProject = updateData;
        }
      } catch (err) {
        console.log('Error updating with slide plan, falling back to individual slides:', err);
        updateError = err;
      }
      
      if (updateError) {
        console.log('Attempting to create individual slides as fallback...');
        
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
          console.error('Failed to create individual slides:', slidesError);
          const errorResponse: ErrorResponse = {
            error: 'Generate failed',
          };
          return NextResponse.json(errorResponse, { status: 500 });
        }
        
        // Update just the slide count and status
        const { data: fallbackUpdate } = await supabase
          .from('projects')
          .update({ 
            slide_count: slidePlan.slides.length,
            status: 'ready'
          })
          .eq('id', project.id)
          .select()
          .single();
        
        if (fallbackUpdate) {
          updatedProject = fallbackUpdate;
        }
      }
      
      // Create individual slides for compatibility (only if not already created in fallback)
      if (!updateError) {
        console.log('Creating individual slides for compatibility...');
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
          console.error('Failed to create individual slides (non-critical):', slidesError);
          // Don't fail the request, just log the error
        }
      }
      
      // Deduct tokens for successful presentation creation
      const tokenDeduction = await deductTokens(user.id, 'create_presentation', project.id, {
        title,
        language,
        slideCount: slidePlan.slides.length
      });
      
      if (!tokenDeduction.success) {
        console.error('Failed to deduct tokens:', tokenDeduction.error);
        // Don't fail the request, but log the error for monitoring
      }
      
      // Return the project and plan
      return NextResponse.json({
        project: updatedProject,
        plan: slidePlan,
        remaining: rateLimitResult.remaining,
        tokensDeducted: tokenDeduction.tokensDeducted,
        remainingTokens: tokenDeduction.remainingTokens,
      });
      
    } catch (generationError) {
      console.error('Slide generation failed:', generationError);
      console.error('Generation error details:', {
        message: generationError instanceof Error ? generationError.message : 'Unknown error',
        stack: generationError instanceof Error ? generationError.stack : undefined,
        name: generationError instanceof Error ? generationError.name : undefined
      });
      console.error('Full error object:', generationError);
      
      // Try to update project status to error
      try {
        await supabase
          .from('projects')
          .update({
            status: 'error',
            generate_error: generationError instanceof Error ? generationError.message : 'Unknown error'
          })
          .eq('id', project.id);
      } catch (updateErr) {
        console.error('Failed to update project status to error:', updateErr);
      }
      
      const errorResponse: ErrorResponse = {
        error: 'Generate failed',
      };
      console.log('Returning generation error response:', errorResponse);
      return NextResponse.json(errorResponse, { status: 500 });
    }
    
  } catch (error) {
    console.error('Create and generate API error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    
    const errorResponse: ErrorResponse = {
      error: error instanceof Error ? error.message : 'Internal server error',
    };
    
    console.log('Returning error response:', errorResponse);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
