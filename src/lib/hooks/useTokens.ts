"use client";

import { useState, useEffect, useCallback } from 'react';
import { SubscriptionPlan, ActionType } from '@/lib/config/pricing';
import { useAuth } from './useAuth';
import { createClient } from '@/lib/supabase/client';

interface TokenInfo {
  userId: string;
  currentTokens: number;
  rolloverTokens: number;
  totalAvailableTokens: number;
  subscriptionPlan: SubscriptionPlan;
  tokensResetDate: string;
  totalTokensUsed: number;
  subscriptionStatus: string;
}

interface TokenUsageHistory {
  usage: Array<{
    id: string;
    action_type: ActionType;
    tokens_consumed: number;
    project_id: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
  }>;
  totalPages: number;
  currentPage: number;
}

interface TokenUsageStats {
  totalTokensUsed: number;
  tokensUsedThisMonth: number;
  averageTokensPerDay: number;
  mostUsedActions: Array<{ action: ActionType; count: number; tokens: number }>;
}

interface TokenData {
  tokenInfo: TokenInfo | null;
  usageHistory: TokenUsageHistory | null;
  usageStats: TokenUsageStats | null;
  isLoading: boolean;
  error: string | null;
}

export function useTokens() {
  const { user, loading: authLoading, initializing } = useAuth();
  
  const [tokenData, setTokenData] = useState<TokenData>({
    tokenInfo: null,
    usageHistory: null,
    usageStats: null,
    isLoading: true,
    error: null,
  });

  const fetchTokenData = useCallback(async () => {
    // Don't fetch if user is not authenticated or auth is still loading
    if (!user || authLoading || initializing) {
      return;
    }

    try {
      setTokenData(prev => ({ ...prev, isLoading: true, error: null }));
      
      const supabase = createClient();
      
      // Fetch all token data in parallel with direct Supabase queries
      const [userResult, usageResult, statsResult] = await Promise.all([
        // Get user token info
        supabase
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
          .eq('id', user.id)
          .single(),
        
        // Get recent usage history (last 10 entries)
        supabase
          .from('token_usage')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
        
        // Get usage stats (aggregated data)
        supabase
          .from('token_usage')
          .select('action_type, tokens_consumed, created_at')
          .eq('user_id', user.id)
      ]);

      // Handle user data
      if (userResult.error || !userResult.data) {
        throw new Error('Failed to fetch user token info');
      }

      const userData = userResult.data;
      const tokenInfo = {
        userId: userData.id,
        currentTokens: userData.current_tokens,
        rolloverTokens: userData.rollover_tokens,
        totalAvailableTokens: userData.current_tokens + userData.rollover_tokens,
        subscriptionPlan: userData.subscription_plan as SubscriptionPlan,
        tokensResetDate: userData.tokens_reset_date,
        totalTokensUsed: userData.total_tokens_used,
        subscriptionStatus: userData.subscription_status
      };

      // Handle usage history
      const usageHistory = usageResult.data ? {
        usage: usageResult.data.map(usage => ({
          id: usage.id,
          action_type: usage.action_type as ActionType,
          tokens_consumed: usage.tokens_consumed,
          project_id: usage.project_id,
          metadata: usage.metadata,
          created_at: usage.created_at
        })),
        totalPages: Math.ceil((usageResult.data.length || 0) / 10),
        currentPage: 1
      } : null;

      // Calculate usage stats
      let usageStats = null;
      if (statsResult.data && statsResult.data.length > 0) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const totalTokensUsed = statsResult.data.reduce((sum, usage) => sum + usage.tokens_consumed, 0);
        const tokensUsedThisMonth = statsResult.data
          .filter(usage => new Date(usage.created_at) >= startOfMonth)
          .reduce((sum, usage) => sum + usage.tokens_consumed, 0);
        
        const daysInMonth = Math.ceil((now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24));
        const averageTokensPerDay = daysInMonth > 0 ? tokensUsedThisMonth / daysInMonth : 0;
        
        // Calculate most used actions
        const actionCounts = statsResult.data.reduce((acc, usage) => {
          const action = usage.action_type as ActionType;
          if (!acc[action]) {
            acc[action] = { count: 0, tokens: 0 };
          }
          acc[action].count += 1;
          acc[action].tokens += usage.tokens_consumed;
          return acc;
        }, {} as Record<ActionType, { count: number; tokens: number }>);
        
        const mostUsedActions = Object.entries(actionCounts)
          .map(([action, data]) => ({ action: action as ActionType, ...data }))
          .sort((a, b) => b.tokens - a.tokens)
          .slice(0, 5);
        
        usageStats = {
          totalTokensUsed,
          tokensUsedThisMonth,
          averageTokensPerDay,
          mostUsedActions
        };
      }
      
      setTokenData({
        tokenInfo,
        usageHistory,
        usageStats,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching token data:', error);
      setTokenData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [user, authLoading, initializing]);

  const purchaseTokens = useCallback(async (packageId: string, paymentReference?: string, paymentProvider?: string) => {
    try {
      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          paymentReference,
          paymentProvider,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to purchase tokens');
      }

      const data = await response.json();
      
      // Refresh token data after successful purchase
      await fetchTokenData();
      
      return data;
    } catch (error) {
      console.error('Error purchasing tokens:', error);
      throw error;
    }
  }, [fetchTokenData]);

  const updateSubscription = useCallback(async (plan: SubscriptionPlan, subscriptionId?: string, stripeCustomerId?: string) => {
    try {
      const response = await fetch('/api/tokens', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          subscriptionId,
          stripeCustomerId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update subscription');
      }

      const data = await response.json();
      
      // Refresh token data after successful update
      await fetchTokenData();
      
      return data;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }, [fetchTokenData]);

  const checkTokensForAction = useCallback(async (actionType: ActionType, projectId?: string) => {
    if (!tokenData.tokenInfo) {
      return { hasEnoughTokens: false, message: 'Token info not available' };
    }

    // This would typically call a separate API endpoint
    // For now, we'll do a simple client-side check
    const requiredTokens = getActionCost(actionType);
    const availableTokens = tokenData.tokenInfo.totalAvailableTokens;
    
    return {
      hasEnoughTokens: availableTokens >= requiredTokens,
      availableTokens,
      requiredTokens,
      message: availableTokens >= requiredTokens 
        ? undefined 
        : `Insufficient tokens. You need ${requiredTokens} tokens but only have ${availableTokens} available.`
    };
  }, [tokenData.tokenInfo]);

  const refreshTokens = useCallback(() => {
    fetchTokenData();
  }, [fetchTokenData]);

  useEffect(() => {
    // Only fetch token data when user is authenticated and auth is not loading
    if (user && !authLoading && !initializing) {
      fetchTokenData();
    } else if (!user && !authLoading && !initializing) {
      // User is not authenticated, clear token data
      setTokenData({
        tokenInfo: null,
        usageHistory: null,
        usageStats: null,
        isLoading: false,
        error: null,
      });
    }
  }, [user, authLoading, initializing, fetchTokenData]);

  return {
    ...tokenData,
    purchaseTokens,
    updateSubscription,
    checkTokensForAction,
    refreshTokens,
  };
}

// Helper function to get action cost (this should match the server-side config)
function getActionCost(actionType: ActionType): number {
  const costs = {
    create_presentation: 10,
    add_edit_slide: 1,
    export_presentation: 3,
    generate_analytics: 8,
    regenerate_slides: 10,
  };
  return costs[actionType] || 0;
}
