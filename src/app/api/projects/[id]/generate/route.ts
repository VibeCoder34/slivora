import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateSlidePlan } from '@/lib/llm';
import { hitRateLimit } from '@/lib/rateLimit';
import { ErrorResponse } from '@/types/slide-plan';
import { checkUserTokens, deductTokens } from '@/lib/token-system';

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
 * POST /api/projects/[id]/generate
 * Regenerate slides for an existing project
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    
    if (!projectId) {
      const errorResponse: ErrorResponse = {
        error: 'Project ID is required',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      const errorResponse: ErrorResponse = {
        error: 'Unauthorized',
      };
      return NextResponse.json(errorResponse, { status: 401 });
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
    
    // Load project (RLS will ensure user can only access their own projects)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (projectError || !project) {
      const errorResponse: ErrorResponse = {
        error: 'Project not found',
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }
    
    // Check if user has enough tokens for regenerating slides
    const tokenCheck = await checkUserTokens(user.id, 'regenerate_slides', projectId);
    if (!tokenCheck.hasEnoughTokens) {
      const errorResponse: ErrorResponse = {
        error: 'Insufficient tokens',
        message: tokenCheck.message,
        currentPlan: tokenCheck.currentPlan,
        availableTokens: tokenCheck.availableTokens,
        requiredTokens: tokenCheck.requiredTokens,
      };
      return NextResponse.json(errorResponse, { status: 402 }); // 402 Payment Required
    }
    
    // Set project status to generating
    const { error: updateStatusError } = await supabase
      .from('projects')
      .update({
        status: 'generating',
        generate_error: null,
      })
      .eq('id', projectId);
    
    if (updateStatusError) {
      console.error('Failed to update project status:', updateStatusError);
      const errorResponse: ErrorResponse = {
        error: 'Failed to update project status',
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }
    
    try {
      // Generate new slide plan using existing project data
      const slidePlan = await generateSlidePlan({
        title: project.title,
        language: project.language,
        outline: project.outline_text,
      });
      
      // Update project with new slide plan
      const { data: updatedProject, error: updateError } = await supabase
        .from('projects')
        .update({
          status: 'ready',
          slide_plan: slidePlan,
          slides_count: slidePlan.slides.length,
          slide_count: slidePlan.slides.length, // Keep both for compatibility
          last_generated_at: new Date().toISOString(),
          generate_error: null,
        })
        .eq('id', projectId)
        .select()
        .single();
      
      if (updateError) {
        console.error('Failed to update project with new slide plan:', updateError);
        // Mark project as error
        await supabase
          .from('projects')
          .update({
            status: 'error',
            generate_error: 'Failed to save new slide plan',
          })
          .eq('id', projectId);
        
        const errorResponse: ErrorResponse = {
          error: 'Generate failed',
        };
        return NextResponse.json(errorResponse, { status: 500 });
      }
      
      // Deduct tokens for successful slide regeneration
      const tokenDeduction = await deductTokens(user.id, 'regenerate_slides', projectId, {
        title: project.title,
        slideCount: slidePlan.slides.length
      });
      
      if (!tokenDeduction.success) {
        console.error('Failed to deduct tokens:', tokenDeduction.error);
        // Don't fail the request, but log the error for monitoring
      }
      
      // Return the updated project and plan
      return NextResponse.json({
        project: updatedProject,
        plan: slidePlan,
        remaining: rateLimitResult.remaining,
        tokensDeducted: tokenDeduction.tokensDeducted,
        remainingTokens: tokenDeduction.remainingTokens,
      });
      
    } catch (generationError) {
      console.error('Slide regeneration failed:', generationError);
      
      // Mark project as error
      await supabase
        .from('projects')
        .update({
          status: 'error',
          generate_error: generationError instanceof Error ? generationError.message : 'Unknown generation error',
        })
        .eq('id', projectId);
      
      const errorResponse: ErrorResponse = {
        error: 'Generate failed',
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }
    
  } catch (error) {
    console.error('Regenerate API error:', error);
    
    const errorResponse: ErrorResponse = {
      error: error instanceof Error ? error.message : 'Internal server error',
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
