"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Coins, 
  TrendingUp, 
  Calendar, 
  Zap, 
  Crown, 
  ArrowUpRight,
  RefreshCw,
  History,
  BarChart3
} from "lucide-react";
import { SUBSCRIPTION_PLANS, TOKEN_TOP_UP_PACKAGES, ActionType } from "@/lib/config/pricing";

interface TokenInfo {
  userId: string;
  currentTokens: number;
  rolloverTokens: number;
  totalAvailableTokens: number;
  subscriptionPlan: string;
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

interface TokenUsageProps {
  tokenInfo: TokenInfo | null;
  usageHistory?: TokenUsageHistory | null;
  usageStats?: TokenUsageStats | null;
  onUpgrade?: () => void;
  onPurchaseTokens?: () => void;
  onViewHistory?: () => void;
  isLoading?: boolean;
}

export function TokenUsage({
  tokenInfo,
  usageHistory,
  usageStats,
  onUpgrade,
  onPurchaseTokens,
  onViewHistory,
  isLoading = false
}: TokenUsageProps) {
  // Early return if tokenInfo is null
  if (!tokenInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Token Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const planConfig = SUBSCRIPTION_PLANS[tokenInfo.subscriptionPlan as keyof typeof SUBSCRIPTION_PLANS];
  const resetDate = new Date(tokenInfo.tokensResetDate);
  const daysUntilReset = Math.ceil((resetDate.getTime() + 30 * 24 * 60 * 60 * 1000 - Date.now()) / (1000 * 60 * 60 * 24));
  
  const getUsagePercentage = () => {
    if (!planConfig) return 0;
    const used = planConfig.monthlyTokens - tokenInfo.currentTokens;
    return Math.min((used / planConfig.monthlyTokens) * 100, 100);
  };

  const getActionDisplayName = (action: ActionType) => {
    const names = {
      create_presentation: 'Create Presentation',
      add_edit_slide: 'Add/Edit Slide',
      export_presentation: 'Export Presentation',
      generate_analytics: 'Generate Analytics',
      regenerate_slides: 'Regenerate Slides'
    };
    return names[action] || action;
  };

  const getActionIcon = (action: ActionType) => {
    switch (action) {
      case 'create_presentation': return <Zap className="h-4 w-4" />;
      case 'add_edit_slide': return <Edit className="h-4 w-4" />;
      case 'export_presentation': return <Download className="h-4 w-4" />;
      case 'generate_analytics': return <BarChart3 className="h-4 w-4" />;
      case 'regenerate_slides': return <RefreshCw className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Token Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Token Usage Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              <CardTitle>Token Usage</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={tokenInfo.subscriptionPlan === 'free' ? 'secondary' : 'primary'}>
                {planConfig?.name || tokenInfo.subscriptionPlan}
              </Badge>
              {tokenInfo.subscriptionPlan !== 'free' && (
                <Crown className="h-4 w-4 text-yellow-500" />
              )}
            </div>
          </div>
          <CardDescription>
            Your current plan and token usage for this billing cycle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Token Balance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-primary">{tokenInfo.totalAvailableTokens}</div>
              <div className="text-sm text-muted-foreground">Available Tokens</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-orange-500">{tokenInfo.totalTokensUsed}</div>
              <div className="text-sm text-muted-foreground">Used This Month</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-500">{daysUntilReset}</div>
              <div className="text-sm text-muted-foreground">Days Until Reset</div>
            </div>
          </div>

          {/* Usage Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Monthly Usage</span>
              <span>{Math.round(getUsagePercentage())}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${getUsagePercentage()}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {tokenInfo.currentTokens} / {planConfig?.monthlyTokens || 0} tokens remaining
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            {tokenInfo.subscriptionPlan === 'free' ? (
              <Button onClick={onUpgrade} className="gap-2">
                <ArrowUpRight className="h-4 w-4" />
                Upgrade Plan
              </Button>
            ) : (
              <Button variant="outline" onClick={onUpgrade} className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Manage Subscription
              </Button>
            )}
            <Button variant="outline" onClick={onPurchaseTokens} className="gap-2">
              <Coins className="h-4 w-4" />
              Buy More Tokens
            </Button>
            <Button variant="ghost" onClick={onViewHistory} className="gap-2">
              <History className="h-4 w-4" />
              View History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      {usageStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Usage Statistics
            </CardTitle>
            <CardDescription>
              Your token usage patterns and trends
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-xl font-bold">{usageStats.averageTokensPerDay.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Avg per day</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-xl font-bold">{usageStats.tokensUsedThisMonth}</div>
                <div className="text-sm text-muted-foreground">This month</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-xl font-bold">{usageStats.totalTokensUsed}</div>
                <div className="text-sm text-muted-foreground">Total used</div>
              </div>
            </div>

            {usageStats.mostUsedActions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Most Used Actions</h4>
                <div className="space-y-2">
                  {usageStats.mostUsedActions.slice(0, 3).map((action, index) => (
                    <div key={action.action} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <div className="flex items-center gap-2">
                        {getActionIcon(action.action)}
                        <span className="text-sm">{getActionDisplayName(action.action)}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {action.tokens} tokens ({action.count} times)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Usage History */}
      {usageHistory && usageHistory.usage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Usage
            </CardTitle>
            <CardDescription>
              Your recent token-consuming actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {usageHistory.usage.slice(0, 5).map((usage) => (
                <div key={usage.id} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                  <div className="flex items-center gap-3">
                    {getActionIcon(usage.action_type)}
                    <div>
                      <div className="font-medium text-sm">{getActionDisplayName(usage.action_type)}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(usage.created_at).toLocaleDateString()} at {new Date(usage.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm">-{usage.tokens_consumed}</div>
                    <div className="text-xs text-muted-foreground">tokens</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Import icons that are used
import { Edit, Download } from "lucide-react";
