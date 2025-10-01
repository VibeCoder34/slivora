/**
 * Token System Core Functions
 * 
 * This module provides the core functionality for the token-based pricing system.
 * It handles token checking, deduction, usage tracking, and user management.
 */

import { createClient } from './supabase/server';
import { 
  ActionType, 
  SubscriptionPlan, 
  getActionCost, 
  getPlanConfig, 
  getTopUpPackage,
  TOKEN_SYSTEM_CONFIG,
  DEFAULT_PLAN
} from './config/pricing';
import { Database } from './supabase/types';

type TokenUsage = Database['public']['Tables']['token_usage']['Row'];
type TokenTransaction = Database['public']['Tables']['token_transactions']['Row'];
type User = Database['public']['Tables']['users']['Row'];

export interface TokenCheckResult {
  hasEnoughTokens: boolean;
  availableTokens: number;
  requiredTokens: number;
  currentPlan: SubscriptionPlan;
  message?: string;
}

export interface TokenDeductionResult {
  success: boolean;
  tokensDeducted: number;
  remainingTokens: number;
  usageId?: string;
  error?: string;
}

export interface UserTokenInfo {
  userId: string;
  currentTokens: number;
  rolloverTokens: number;
  totalAvailableTokens: number;
  subscriptionPlan: SubscriptionPlan;
  tokensResetDate: string;
  totalTokensUsed: number;
  subscriptionStatus: string;
}

export interface TokenUsageHistory {
  usage: TokenUsage[];
  totalPages: number;
  currentPage: number;
}

/**
 * Check if a user has enough tokens for a specific action
 */
export async function checkUserTokens(
  userId: string, 
  actionType: ActionType,
  projectId?: string
): Promise<TokenCheckResult> {
  try {
    const supabase = await createClient();
    const requiredTokens = getActionCost(actionType);

    // Get user's current token information
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('current_tokens, rollover_tokens, subscription_plan, subscription_status')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return {
        hasEnoughTokens: false,
        availableTokens: 0,
        requiredTokens,
        currentPlan: DEFAULT_PLAN,
        message: 'User not found or error fetching user data'
      };
    }

    const availableTokens = user.current_tokens + user.rollover_tokens;
    const hasEnoughTokens = availableTokens >= requiredTokens;

    return {
      hasEnoughTokens,
      availableTokens,
      requiredTokens,
      currentPlan: user.subscription_plan as SubscriptionPlan,
      message: hasEnoughTokens 
        ? undefined 
        : `Insufficient tokens. You need ${requiredTokens} tokens but only have ${availableTokens} available.`
    };
  } catch (error) {
    console.error('Error checking user tokens:', error);
    return {
      hasEnoughTokens: false,
      availableTokens: 0,
      requiredTokens: getActionCost(actionType),
      currentPlan: DEFAULT_PLAN,
      message: 'Error checking tokens'
    };
  }
}

/**
 * Deduct tokens from a user's account for a specific action
 */
export async function deductTokens(
  userId: string,
  actionType: ActionType,
  projectId?: string,
  metadata?: Record<string, unknown>
): Promise<TokenDeductionResult> {
  try {
    const supabase = await createClient();
    const requiredTokens = getActionCost(actionType);

    // First check if user has enough tokens
    const tokenCheck = await checkUserTokens(userId, actionType, projectId);
    if (!tokenCheck.hasEnoughTokens) {
      return {
        success: false,
        tokensDeducted: 0,
        remainingTokens: tokenCheck.availableTokens,
        error: tokenCheck.message
      };
    }

    // Use the database function to deduct tokens
    const { data: deductionResult, error: deductionError } = await supabase
      .rpc('deduct_user_tokens', {
        p_user_id: userId,
        p_tokens_to_deduct: requiredTokens
      });

    if (deductionError || !deductionResult) {
      return {
        success: false,
        tokensDeducted: 0,
        remainingTokens: tokenCheck.availableTokens,
        error: 'Failed to deduct tokens from database'
      };
    }

    // Log the token usage
    const { data: usageId, error: logError } = await supabase
      .rpc('log_token_usage', {
        p_user_id: userId,
        p_action_type: actionType,
        p_tokens_consumed: requiredTokens,
        p_project_id: projectId || null,
        p_metadata: metadata || {}
      });

    if (logError) {
      console.error('Error logging token usage:', logError);
      // Don't fail the transaction, but log the error
    }

    // Get updated token balance
    const { data: updatedUser } = await supabase
      .from('users')
      .select('current_tokens, rollover_tokens')
      .eq('id', userId)
      .single();

    const remainingTokens = (updatedUser?.current_tokens || 0) + (updatedUser?.rollover_tokens || 0);

    return {
      success: true,
      tokensDeducted: requiredTokens,
      remainingTokens,
      usageId: usageId as string
    };
  } catch (error) {
    console.error('Error deducting tokens:', error);
    return {
      success: false,
      tokensDeducted: 0,
      remainingTokens: 0,
      error: 'Error deducting tokens'
    };
  }
}

/**
 * Get comprehensive token information for a user
 */
export async function getUserTokenInfo(userId: string): Promise<UserTokenInfo | null> {
  try {
    const supabase = await createClient();

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        current_tokens,
        rollover_tokens,
        subscription_plan,
        tokens_reset_date,
        total_tokens_used,
        subscription_status
      `)
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.error('Error fetching user token info:', error);
      return null;
    }

    return {
      userId: user.id,
      currentTokens: user.current_tokens,
      rolloverTokens: user.rollover_tokens,
      totalAvailableTokens: user.current_tokens + user.rollover_tokens,
      subscriptionPlan: user.subscription_plan as SubscriptionPlan,
      tokensResetDate: user.tokens_reset_date,
      totalTokensUsed: user.total_tokens_used,
      subscriptionStatus: user.subscription_status
    };
  } catch (error) {
    console.error('Error getting user token info:', error);
    return null;
  }
}

/**
 * Get token usage history for a user
 */
export async function getTokenUsageHistory(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<TokenUsageHistory | null> {
  try {
    const supabase = await createClient();
    const offset = (page - 1) * pageSize;

    // Get usage records with pagination - simplified query without join for better performance
    const { data: usage, error: usageError } = await supabase
      .from('token_usage')
      .select(`
        id,
        action_type,
        tokens_consumed,
        project_id,
        metadata,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (usageError) {
      console.error('Error fetching token usage history:', usageError);
      return null;
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('token_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      console.error('Error fetching token usage count:', countError);
      return null;
    }

    return {
      usage: usage || [],
      totalPages: Math.ceil((count || 0) / pageSize),
      currentPage: page
    };
  } catch (error) {
    console.error('Error getting token usage history:', error);
    return null;
  }
}

/**
 * Purchase token top-up package
 */
export async function purchaseTokens(
  userId: string,
  packageId: string,
  paymentReference?: string,
  paymentProvider?: string
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const tokenPackage = getTopUpPackage(packageId);

    if (!tokenPackage) {
      return {
        success: false,
        error: 'Invalid token package'
      };
    }

    // Add tokens to user's account
    const { data: transactionId, error: addError } = await supabase
      .rpc('add_user_tokens', {
        p_user_id: userId,
        p_tokens_to_add: tokenPackage.tokens,
        p_transaction_type: 'purchase'
      });

    if (addError) {
      console.error('Error adding tokens:', addError);
      return {
        success: false,
        error: 'Failed to add tokens to account'
      };
    }

    // Log the transaction with payment details
    const { error: transactionError } = await supabase
      .from('token_transactions')
      .update({
        amount_paid: tokenPackage.price,
        payment_provider: paymentProvider || 'manual',
        payment_reference: paymentReference,
        description: `Purchased ${tokenPackage.tokens} tokens`
      })
      .eq('id', transactionId);

    if (transactionError) {
      console.error('Error updating transaction details:', transactionError);
      // Don't fail the operation, tokens were already added
    }

    return {
      success: true,
      transactionId: transactionId as string
    };
  } catch (error) {
    console.error('Error purchasing tokens:', error);
    return {
      success: false,
      error: 'Error purchasing tokens'
    };
  }
}

/**
 * Update user's subscription plan
 */
export async function updateUserSubscription(
  userId: string,
  newPlan: SubscriptionPlan,
  subscriptionId?: string,
  stripeCustomerId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const planConfig = getPlanConfig(newPlan);

    const { error } = await supabase
      .from('users')
      .update({
        subscription_plan: newPlan,
        subscription_id: subscriptionId,
        stripe_customer_id: stripeCustomerId,
        subscription_status: 'active'
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user subscription:', error);
      return {
        success: false,
        error: 'Failed to update subscription'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating subscription:', error);
    return {
      success: false,
      error: 'Error updating subscription'
    };
  }
}

/**
 * Reset user tokens for new billing cycle
 */
export async function resetUserTokensForBillingCycle(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get user's current plan and usage
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('subscription_plan, current_tokens, rollover_tokens, total_tokens_used')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    const planConfig = getPlanConfig(user.subscription_plan as SubscriptionPlan);
    
    // Calculate rollover tokens
    const rolloverTokens = Math.floor(
      Math.max(0, user.current_tokens) * (planConfig.rolloverPercentage / 100)
    );

    // Update user with new token allocation
    const { error: updateError } = await supabase
      .from('users')
      .update({
        current_tokens: planConfig.monthlyTokens,
        rollover_tokens: rolloverTokens,
        tokens_reset_date: new Date().toISOString(),
        total_tokens_used: 0
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error resetting user tokens:', updateError);
      return {
        success: false,
        error: 'Failed to reset tokens'
      };
    }

    // Create new billing cycle record
    const cycleStart = new Date();
    const cycleEnd = new Date();
    cycleEnd.setDate(cycleEnd.getDate() + TOKEN_SYSTEM_CONFIG.BILLING_CYCLE_DAYS);

    const { error: billingError } = await supabase
      .from('billing_cycles')
      .insert({
        user_id: userId,
        cycle_start: cycleStart.toISOString(),
        cycle_end: cycleEnd.toISOString(),
        tokens_allocated: planConfig.monthlyTokens,
        tokens_used: user.total_tokens_used,
        tokens_rolled_over: rolloverTokens,
        subscription_plan: user.subscription_plan,
        amount_billed: planConfig.price
      });

    if (billingError) {
      console.error('Error creating billing cycle:', billingError);
      // Don't fail the operation, tokens were already reset
    }

    return { success: true };
  } catch (error) {
    console.error('Error resetting tokens for billing cycle:', error);
    return {
      success: false,
      error: 'Error resetting tokens'
    };
  }
}

/**
 * Get token usage statistics for analytics
 */
export async function getTokenUsageStats(userId: string): Promise<{
  totalTokensUsed: number;
  tokensUsedThisMonth: number;
  averageTokensPerDay: number;
  mostUsedActions: Array<{ action: ActionType; count: number; tokens: number }>;
} | null> {
  try {
    const supabase = await createClient();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Use a single query with aggregation for better performance
    const { data: usageData, error: usageError } = await supabase
      .from('token_usage')
      .select('tokens_consumed, action_type, created_at')
      .eq('user_id', userId);

    if (usageError) {
      console.error('Error fetching usage data:', usageError);
      return null;
    }

    if (!usageData || usageData.length === 0) {
      return {
        totalTokensUsed: 0,
        tokensUsedThisMonth: 0,
        averageTokensPerDay: 0,
        mostUsedActions: []
      };
    }

    // Calculate stats from the single query result
    const totalTokensUsed = usageData.reduce((sum, usage) => sum + usage.tokens_consumed, 0);
    
    const monthlyUsage = usageData.filter(usage => 
      new Date(usage.created_at) >= thirtyDaysAgo
    );
    
    const tokensUsedThisMonth = monthlyUsage.reduce((sum, usage) => sum + usage.tokens_consumed, 0);
    const averageTokensPerDay = tokensUsedThisMonth / 30;

    // Calculate action usage from monthly data
    const actionStats = new Map<ActionType, { count: number; tokens: number }>();
    
    monthlyUsage.forEach(usage => {
      const action = usage.action_type as ActionType;
      const current = actionStats.get(action) || { count: 0, tokens: 0 };
      actionStats.set(action, {
        count: current.count + 1,
        tokens: current.tokens + usage.tokens_consumed
      });
    });

    const mostUsedActions = Array.from(actionStats.entries())
      .map(([action, stats]) => ({ action, ...stats }))
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 5);

    return {
      totalTokensUsed,
      tokensUsedThisMonth,
      averageTokensPerDay,
      mostUsedActions
    };
  } catch (error) {
    console.error('Error getting token usage stats:', error);
    return null;
  }
}
