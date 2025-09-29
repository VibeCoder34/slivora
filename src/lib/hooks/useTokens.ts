"use client";

import { useState, useEffect, useCallback } from 'react';
import { SubscriptionPlan, ActionType } from '@/lib/config/pricing';

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
    metadata: any;
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
  const [tokenData, setTokenData] = useState<TokenData>({
    tokenInfo: null,
    usageHistory: null,
    usageStats: null,
    isLoading: true,
    error: null,
  });

  const fetchTokenData = useCallback(async () => {
    try {
      setTokenData(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch('/api/tokens');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch token data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setTokenData({
        tokenInfo: data.tokenInfo,
        usageHistory: data.usageHistory,
        usageStats: data.usageStats,
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
  }, []);

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
    // Start loading immediately, don't wait for dependencies
    fetchTokenData();
  }, []); // Remove fetchTokenData dependency to start loading immediately

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
