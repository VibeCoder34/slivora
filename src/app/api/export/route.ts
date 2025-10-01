import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildPptxBuffer, generateFilename } from '@/lib/pptx';
import { hitRateLimit } from '@/lib/rateLimit';
import { SlidePlanSchema, formatValidationErrors, ErrorResponse } from '@/types/slide-plan';

// Rate limiting configuration
const EXPORT_RATE_LIMIT = {
  limit: 3,
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
 * POST /api/export
 * Generate and download a PowerPoint file from a slide plan
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = SlidePlanSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errorResponse: ErrorResponse = {
        error: 'Validation error',
        issues: formatValidationErrors(validationResult.error),
      };
      return NextResponse.json(errorResponse, { status: 422 });
    }
    
    const slidePlan = validationResult.data;
    
    // Check slide count limit
    if (slidePlan.slides.length > 30) {
      const errorResponse: ErrorResponse = {
        error: 'Too many slides (max 30)',
      };
      return NextResponse.json(errorResponse, { status: 413 });
    }
    
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    const rateLimitKey = `exp:${clientIP}`;
    
    // Check rate limit
    const rateLimitResult = hitRateLimit(
      rateLimitKey,
      EXPORT_RATE_LIMIT.limit,
      EXPORT_RATE_LIMIT.windowMs
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
    
    // Get user's subscription plan for watermarking
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_plan')
      .eq('id', user.id)
      .single();
    
    const userPlan = userData?.subscription_plan || 'free';
    
    // Generate PowerPoint file
    const buffer = await buildPptxBuffer(slidePlan, undefined, userPlan);
    const filename = generateFilename(slidePlan);
    
    // Return the file as a download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
  } catch (error) {
    console.error('Export API error:', error);
    
    const errorResponse: ErrorResponse = {
      error: error instanceof Error ? error.message : 'Internal server error',
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
