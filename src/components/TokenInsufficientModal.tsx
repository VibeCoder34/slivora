"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertTriangle, 
  Coins, 
  TrendingUp, 
  Zap,
  ArrowRight,
  X
} from "lucide-react";
import { ActionType } from "@/lib/config/pricing";

interface TokenInsufficientModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: ActionType;
  requiredTokens: number;
  availableTokens: number;
  currentPlan: string;
  onUpgradePlan?: () => void;
  onPurchaseTokens?: () => void;
}

export function TokenInsufficientModal({
  isOpen,
  onClose,
  actionType,
  requiredTokens,
  availableTokens,
  currentPlan,
  onUpgradePlan,
  onPurchaseTokens
}: TokenInsufficientModalProps) {
  const getActionDisplayName = (action: ActionType) => {
    const names = {
      create_presentation: 'Create Presentation',
      add_edit_slide: 'Add/Edit Slide',
      export_presentation: 'Export Presentation',
      generate_analytics: 'Generate Analytics',
      regenerate_slides: 'Regenerate Slides',
      generate_study_notes: 'Generate Study Notes'
    };
    return names[action] || action;
  };

  const getActionIcon = (action: ActionType) => {
    switch (action) {
      case 'create_presentation': return <Zap className="h-5 w-5" />;
      case 'add_edit_slide': return <Zap className="h-5 w-5" />;
      case 'export_presentation': return <Zap className="h-5 w-5" />;
      case 'generate_analytics': return <Zap className="h-5 w-5" />;
      case 'regenerate_slides': return <Zap className="h-5 w-5" />;
      case 'generate_study_notes': return <Zap className="h-5 w-5" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  const getActionDescription = (action: ActionType) => {
    const descriptions = {
      create_presentation: 'Generate a complete presentation with AI-powered content and design',
      add_edit_slide: 'Add new slides or edit existing slide content',
      export_presentation: 'Export your presentation to PowerPoint, PDF, or other formats',
      generate_analytics: 'Generate detailed analytics and insights about your presentation',
      regenerate_slides: 'Regenerate slides with new AI-generated content',
      generate_study_notes: 'Generate comprehensive study notes from your presentation content'
    };
    return descriptions[action] || 'Perform this action';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <DialogTitle>Insufficient Tokens</DialogTitle>
          </div>
          <DialogDescription>
            You don&apos;t have enough tokens to {getActionDisplayName(actionType).toLowerCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Action Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {getActionIcon(actionType)}
                <CardTitle className="text-base">{getActionDisplayName(actionType)}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                {getActionDescription(actionType)}
              </CardDescription>
              <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Required tokens:</span>
                  <span className="font-medium">{requiredTokens}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Available tokens:</span>
                  <span className="font-medium text-orange-500">{availableTokens}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t">
                  <span className="text-sm text-muted-foreground">Current plan:</span>
                  <span className="font-medium">{currentPlan}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Solutions */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Choose how to continue:</h4>
            
            {/* Upgrade Plan Option */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h5 className="font-medium">Upgrade Your Plan</h5>
                      <p className="text-sm text-muted-foreground mt-1">
                        Get more monthly tokens and unlock premium features
                      </p>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={onUpgradePlan}
                  className="w-full mt-3 gap-2"
                  size="sm"
                >
                  <ArrowRight className="h-4 w-4" />
                  View Plans
                </Button>
              </CardContent>
            </Card>

            {/* Buy Tokens Option */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Coins className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium">Buy More Tokens</h5>
                      <p className="text-sm text-muted-foreground mt-1">
                        Purchase additional tokens to continue using SLIVORA
                      </p>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={onPurchaseTokens}
                  variant="outline"
                  className="w-full mt-3 gap-2"
                  size="sm"
                >
                  <Coins className="h-4 w-4" />
                  Buy Tokens
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Need help? <a href="#" className="text-primary hover:underline">Contact support</a>
            </p>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
