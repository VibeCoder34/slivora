"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Crown, 
  Check, 
  Zap, 
  Users, 
  Building2, 
  Star,
  Coins,
  ArrowRight,
  X,
  TrendingUp
} from "lucide-react";
import { SUBSCRIPTION_PLANS, TOKEN_TOP_UP_PACKAGES, SubscriptionPlan } from "@/lib/config/pricing";

interface TokenUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: SubscriptionPlan;
  currentTokens: number;
  onUpgradePlan?: (planId: SubscriptionPlan) => void;
  onPurchaseTokens?: (packageId: string) => void;
  isLoading?: boolean;
}

export function TokenUpgradeModal({
  isOpen,
  onClose,
  currentPlan,
  currentTokens,
  onUpgradePlan,
  onPurchaseTokens,
  isLoading = false
}: TokenUpgradeModalProps) {
  const [activeTab, setActiveTab] = React.useState<'plans' | 'tokens'>('plans');

  const handleUpgradePlan = (planId: SubscriptionPlan) => {
    if (onUpgradePlan) {
      onUpgradePlan(planId);
    }
  };

  const handlePurchaseTokens = (packageId: string) => {
    if (onPurchaseTokens) {
      onPurchaseTokens(packageId);
    }
  };

  const getPlanIcon = (planId: SubscriptionPlan) => {
    switch (planId) {
      case 'free': return <Zap className="h-5 w-5" />;
      case 'pro': return <Star className="h-5 w-5" />;
      case 'business': return <Users className="h-5 w-5" />;
      case 'enterprise': return <Building2 className="h-5 w-5" />;
    }
  };

  const isCurrentPlan = (planId: SubscriptionPlan) => planId === currentPlan;
  const isUpgrade = (planId: SubscriptionPlan) => {
    const planOrder = ['free', 'pro', 'business', 'enterprise'];
    return planOrder.indexOf(planId) > planOrder.indexOf(currentPlan);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            Choose a plan that fits your needs or purchase additional tokens
          </DialogDescription>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <Button
            variant={activeTab === 'plans' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('plans')}
            className="flex-1"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Subscription Plans
          </Button>
          <Button
            variant={activeTab === 'tokens' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('tokens')}
            className="flex-1"
          >
            <Coins className="h-4 w-4 mr-2" />
            Buy Tokens
          </Button>
        </div>

        {/* Current Status */}
        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Current Plan: {SUBSCRIPTION_PLANS[currentPlan].name}</h3>
              <p className="text-sm text-muted-foreground">
                {currentTokens} tokens remaining
              </p>
            </div>
            <Badge variant={currentPlan === 'free' ? 'secondary' : 'primary'}>
              {SUBSCRIPTION_PLANS[currentPlan].name}
            </Badge>
          </div>
        </div>

        {/* Subscription Plans Tab */}
        {activeTab === 'plans' && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(SUBSCRIPTION_PLANS).map(([planId, plan]) => {
                const isCurrent = isCurrentPlan(planId as SubscriptionPlan);
                const isUpgradeOption = isUpgrade(planId as SubscriptionPlan);
                
                return (
                  <Card 
                    key={planId} 
                    className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''} ${isCurrent ? 'ring-2 ring-primary' : ''}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-2">
                      <div className="flex justify-center mb-2">
                        {getPlanIcon(planId as SubscriptionPlan)}
                      </div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold">
                          ${plan.price}
                          {plan.price > 0 && <span className="text-sm font-normal text-muted-foreground">/month</span>}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {plan.monthlyTokens.toLocaleString()} tokens
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <ul className="space-y-2 text-sm">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <div className="pt-2">
                        {isCurrent ? (
                          <Button disabled className="w-full">
                            Current Plan
                          </Button>
                        ) : isUpgradeOption ? (
                          <Button 
                            onClick={() => handleUpgradePlan(planId as SubscriptionPlan)}
                            className="w-full gap-2"
                            disabled={isLoading}
                          >
                            <ArrowRight className="h-4 w-4" />
                            {plan.price > 0 ? 'Upgrade' : 'Downgrade'}
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            onClick={() => handleUpgradePlan(planId as SubscriptionPlan)}
                            className="w-full"
                            disabled={isLoading}
                          >
                            Switch Plan
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Token Top-Up Tab */}
        {activeTab === 'tokens' && (
          <div className="space-y-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <h3 className="font-medium mb-2">Need More Tokens?</h3>
              <p className="text-sm text-muted-foreground">
                Purchase additional tokens to continue using SLIVORA without upgrading your plan
              </p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {TOKEN_TOP_UP_PACKAGES.map((pkg) => (
                <Card 
                  key={pkg.id} 
                  className={`relative ${pkg.popular ? 'border-primary shadow-lg' : ''}`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        Best Value
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-2">
                      <Coins className="h-5 w-5 text-yellow-500" />
                    </div>
                    <CardTitle className="text-lg">{pkg.tokens} Tokens</CardTitle>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold">${pkg.price}</div>
                      <div className="text-sm text-muted-foreground">
                        ${(pkg.price / pkg.tokens).toFixed(3)} per token
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-center text-muted-foreground">
                      {pkg.description}
                    </p>
                    
                    <Button 
                      onClick={() => handlePurchaseTokens(pkg.id)}
                      className="w-full gap-2"
                      disabled={isLoading}
                    >
                      <Coins className="h-4 w-4" />
                      Purchase
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Need help choosing? <a href="#" className="text-primary hover:underline">Contact support</a>
          </p>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
