/**
 * Token Management API Endpoints
 * 
 * GET /api/tokens - Get user's token information
 * POST /api/tokens/purchase - Purchase token top-up
 * POST /api/tokens/subscription - Update subscription plan
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  getUserTokenInfo, 
  getTokenUsageHistory, 
  getTokenUsageStats,
  purchaseTokens,
  updateUserSubscription 
} from '@/lib/token-system';
import { getTopUpPackage, getPlanConfig } from '@/lib/config/pricing';

/**
 * GET /api/tokens
 * Get user's token information, usage history, and statistics
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Run all token data queries in parallel for better performance
    const [tokenInfo, usageHistory, usageStats] = await Promise.all([
      getUserTokenInfo(user.id),
      getTokenUsageHistory(user.id, 1, 10),
      getTokenUsageStats(user.id)
    ]);

    if (!tokenInfo) {
      return NextResponse.json(
        { error: 'Failed to fetch token information' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tokenInfo,
      usageHistory,
      usageStats,
      planConfig: getPlanConfig(tokenInfo.subscriptionPlan)
    });

  } catch (error) {
    console.error('Error fetching token information:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tokens/purchase
 * Purchase token top-up package
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { packageId, paymentReference, paymentProvider } = body;

    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      );
    }

    // Validate package exists
    const tokenPackage = getTopUpPackage(packageId);
    if (!tokenPackage) {
      return NextResponse.json(
        { error: 'Invalid token package' },
        { status: 400 }
      );
    }

    // Purchase tokens
    const result = await purchaseTokens(
      user.id,
      packageId,
      paymentReference,
      paymentProvider
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Get updated token information
    const tokenInfo = await getUserTokenInfo(user.id);

    return NextResponse.json({
      success: true,
      transactionId: result.transactionId,
      tokenInfo,
      package: tokenPackage
    });

  } catch (error) {
    console.error('Error purchasing tokens:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tokens/subscription
 * Update user's subscription plan
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { plan, subscriptionId, stripeCustomerId } = body;

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan is required' },
        { status: 400 }
      );
    }

    // Validate plan exists
    const planConfig = getPlanConfig(plan);
    if (!planConfig) {
      return NextResponse.json(
        { error: 'Invalid subscription plan' },
        { status: 400 }
      );
    }

    // Update subscription
    const result = await updateUserSubscription(
      user.id,
      plan,
      subscriptionId,
      stripeCustomerId
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Get updated token information
    const tokenInfo = await getUserTokenInfo(user.id);

    return NextResponse.json({
      success: true,
      tokenInfo,
      planConfig
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
