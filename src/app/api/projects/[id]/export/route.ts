import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { buildPptxBuffer } from '@/lib/pptx';
import { hitRateLimit } from '@/lib/rateLimit';
import { ErrorResponse } from '@/types/slide-plan';
import { SlidePlan } from '@/types/slide-plan';
import { checkUserTokens, deductTokens } from '@/lib/token-system';

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
 * Create a slug from title for filename
 */
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * POST /api/projects/[id]/export
 * Export project slides as PowerPoint file and upload to storage
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
    const rateLimitKey = `exp:${user.id}`;
    
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
    
    // Get user's subscription plan for watermarking
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_plan')
      .eq('id', user.id)
      .single();
    
    const userPlan = userData?.subscription_plan || 'free';
    
    // Check if project has slide plan
    if (!project.slide_plan) {
      const errorResponse: ErrorResponse = {
        error: 'Project has no slides generated. Please regenerate the project to create slides before exporting.',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    // Check if user has enough tokens for export
    const tokenCheck = await checkUserTokens(user.id, 'export_presentation', projectId);
    if (!tokenCheck.hasEnoughTokens) {
      return NextResponse.json({
        error: 'Insufficient tokens',
        message: tokenCheck.message,
        currentPlan: tokenCheck.currentPlan,
        availableTokens: tokenCheck.availableTokens,
        requiredTokens: tokenCheck.requiredTokens,
      }, { status: 402 }); // 402 Payment Required
    }
    
    // Parse slide plan
    let slidePlan: SlidePlan;
    try {
      slidePlan = project.slide_plan as SlidePlan;
    } catch (parseError) {
      const errorResponse: ErrorResponse = {
        error: 'Invalid slide plan data',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    try {
      // Generate PowerPoint file
      console.log('Starting PowerPoint generation...');
      console.log('Slide plan:', JSON.stringify(slidePlan, null, 2));
      console.log('Project theme:', project.theme);
      console.log('User plan:', userPlan);
      
      // Validate slide plan structure
      if (!slidePlan.slides || !Array.isArray(slidePlan.slides) || slidePlan.slides.length === 0) {
        throw new Error('Invalid slide plan: no slides found');
      }
      
      if (!slidePlan.projectTitle) {
        throw new Error('Invalid slide plan: missing project title');
      }
      
      const buffer = await buildPptxBuffer(slidePlan, project.theme, userPlan);
      console.log('PowerPoint generation completed, buffer size:', buffer.length);
      
      if (!buffer || buffer.length === 0) {
        throw new Error('Generated PowerPoint buffer is empty');
      }
      
      // Create filename
      const slug = createSlug(project.title);
      const filename = `${slug}-${projectId}.pptx`;
      const filePath = `${user.id}/${filename}`;
      
    // Create service client for storage operations
    console.log('Creating service client...');
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
    console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables for storage operations');
    }
    
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Check if storage bucket exists
    console.log('Checking storage bucket...');
    const { data: buckets, error: bucketsError } = await serviceSupabase.storage.listBuckets();
    if (bucketsError) {
      console.error('Failed to list storage buckets:', bucketsError);
      throw new Error(`Storage access failed: ${bucketsError.message}`);
    }
    
    const decksBucket = buckets?.find(bucket => bucket.name === 'decks');
    if (!decksBucket) {
      console.error('Storage bucket "decks" not found. Available buckets:', buckets?.map(b => b.name));
      throw new Error('Storage bucket "decks" not found');
    }
    
    console.log('Storage bucket "decks" found');
      
    // Upload to Supabase Storage
    console.log('Uploading file to storage:', filePath);
      const { data: uploadData, error: uploadError } = await serviceSupabase.storage
        .from('decks')
        .upload(filePath, buffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          upsert: true, // Allow overwriting existing files
        });
      
      if (uploadError) {
        console.error('Failed to upload file to storage:', uploadError);
        const errorResponse: ErrorResponse = {
          error: `Failed to upload file: ${uploadError.message}`,
        };
        return NextResponse.json(errorResponse, { status: 500 });
      }
      
      console.log('File uploaded successfully:', uploadData);
      
      // Create a signed URL for the file (valid for 1 hour)
      console.log('Creating signed URL for file:', filePath);
      const { data: signedUrlData, error: signedUrlError } = await serviceSupabase.storage
        .from('decks')
        .createSignedUrl(filePath, 3600); // 1 hour expiry
      
      if (signedUrlError) {
        console.error('Failed to create signed URL:', signedUrlError);
        const errorResponse: ErrorResponse = {
          error: `Failed to create download URL: ${signedUrlError.message}`,
        };
        return NextResponse.json(errorResponse, { status: 500 });
      }
      
      console.log('Signed URL created successfully:', signedUrlData?.signedUrl);
      
      // Update project with file URL and increment export count
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          pptx_url: signedUrlData.signedUrl,
          export_count: (project.export_count || 0) + 1,
        })
        .eq('id', projectId);
      
      if (updateError) {
        console.error('Failed to update project with file URL:', updateError);
        // Don't fail the request, just log the error
      }
      
      // Deduct tokens for successful export
      const tokenDeduction = await deductTokens(user.id, 'export_presentation', projectId, {
        filename,
        format: 'pptx',
        slideCount: slidePlan.slides.length
      });
      
      if (!tokenDeduction.success) {
        console.error('Failed to deduct tokens:', tokenDeduction.error);
        // Don't fail the request, but log the error for monitoring
      }
      
      // Return the download URL
      return NextResponse.json({
        url: signedUrlData.signedUrl,
        filename,
        remaining: rateLimitResult.remaining,
        tokensDeducted: tokenDeduction.tokensDeducted,
        remainingTokens: tokenDeduction.remainingTokens,
      });
      
    } catch (generationError) {
      console.error('PowerPoint generation failed:', generationError);
      
      // Provide more specific error information
      let errorMessage = 'Export failed';
      if (generationError instanceof Error) {
        errorMessage = `Export failed: ${generationError.message}`;
      }
      
      const errorResponse: ErrorResponse = {
        error: errorMessage,
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }
    
  } catch (error) {
    console.error('Export API error:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = `Export failed: ${error.message}`;
    }
    
    const errorResponse: ErrorResponse = {
      error: errorMessage,
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
