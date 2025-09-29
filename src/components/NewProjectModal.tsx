"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Loader2,
  MessageSquare,
  Sparkles,
  Lock,
  Crown
} from "lucide-react";
import { isThemeAvailableForPlan, getAvailableThemesForPlan, SubscriptionPlan } from "@/lib/config/pricing";
import { THEMES } from "@/lib/themes";

interface NewProject {
  title: string;
  outline_text: string;
  language: string;
  theme: string;
}

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: {
    title: string;
    outline_text: string;
    language: string;
    theme: string;
  }) => Promise<{ projectId?: string; error?: string }>;
  loading?: boolean;
  currentPlan?: SubscriptionPlan;
  onUpgradePlan?: () => void;
}

export function NewProjectModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  currentPlan = 'free',
  onUpgradePlan
}: NewProjectModalProps) {
  const [newProject, setNewProject] = React.useState<NewProject>({
    title: '',
    outline_text: '',
    language: 'en',
    theme: 'minimal'
  });
  const [generatedComment, setGeneratedComment] = React.useState<string | null>(null);
  const [generatingComment, setGeneratingComment] = React.useState(false);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      // Set default theme to first available theme for current plan
      const availableThemes = getAvailableThemesForPlan(currentPlan);
      const defaultTheme = availableThemes[0] || 'minimal';
      
      setNewProject({
        title: '',
        outline_text: '',
        language: 'en',
        theme: defaultTheme
      });
      setGeneratedComment(null);
    }
  }, [isOpen, currentPlan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!newProject.title || !newProject.outline_text) {
      alert('Please fill in both title and outline fields');
      return;
    }

    // Validate theme availability
    if (!isThemeAvailableForPlan(newProject.theme, currentPlan)) {
      alert('Selected theme is not available for your current plan. Please upgrade to access all themes.');
      return;
    }

    try {
      const result = await onSubmit({
        title: newProject.title,
        outline_text: newProject.outline_text,
        language: newProject.language,
        theme: newProject.theme,
      });
      
      if (result?.projectId) {
        // Close modal and redirect to loading page
        onClose();
        // The parent component will handle the redirect
      } else if (result?.error) {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleGenerateComment = async () => {
    if (!newProject.title || !newProject.outline_text) {
      alert('Please fill in both title and outline before generating a comment');
      return;
    }

    setGeneratingComment(true);
    setGeneratedComment(null);

    try {
      const response = await fetch('/api/generate-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newProject.title,
          language: newProject.language,
          outline: newProject.outline_text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate comment');
      }

      setGeneratedComment(data.comment);
    } catch (err) {
      console.error('Error generating comment:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setGeneratingComment(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Describe your presentation idea and let AI create the content
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title</Label>
              <Input
                id="title"
                placeholder="e.g., Q4 Sales Presentation"
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input
                id="language"
                placeholder="en"
                value={newProject.language}
                onChange={(e) => setNewProject({ ...newProject, language: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          {/* Theme Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Presentation Theme</Label>
              {currentPlan === 'free' && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>Upgrade for more themes</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(THEMES).map(([key, theme]) => {
                const isAvailable = isThemeAvailableForPlan(key, currentPlan);
                const isSelected = newProject.theme === key;
                
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (isAvailable) {
                        setNewProject({ ...newProject, theme: key });
                      } else if (onUpgradePlan) {
                        onUpgradePlan();
                      }
                    }}
                    disabled={loading}
                    className={`p-3 border-2 rounded-lg text-left transition-all relative ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : isAvailable
                        ? 'border-border hover:border-primary/50 hover:shadow-md'
                        : 'border-border/50 bg-muted/30 cursor-pointer'
                    } ${!isAvailable ? 'opacity-60' : ''}`}
                  >
                    {!isAvailable && (
                      <div className="absolute top-2 right-2">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex gap-1">
                        {[theme.colors.primary, theme.colors.secondary, theme.colors.accent].map((color, index) => (
                          <div
                            key={index}
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: `#${color}` }}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{theme.name}</span>
                      {!isAvailable && (
                        <Crown className="h-3 w-3 text-yellow-500" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {key === 'minimal' && 'Clean, simple design'}
                      {key === 'modern' && 'Contemporary blue theme'}
                      {key === 'corporate' && 'Professional business style'}
                      {key === 'colorful' && 'Vibrant, energetic colors'}
                      {key === 'creative' && 'Artistic purple gradient'}
                      {key === 'cosmic' && 'Space-inspired design'}
                      {key === 'neon' && 'Cyberpunk neon style'}
                      {key === 'sunset' && 'Warm sunset vibes'}
                    </div>
                    {!isAvailable && (
                      <div className="text-xs text-yellow-600 font-medium mt-1">
                        Upgrade to unlock
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="outline">Presentation Outline</Label>
            <Textarea
              id="outline"
              placeholder="Describe your presentation topic, key points, target audience, and any specific requirements..."
              value={newProject.outline_text}
              onChange={(e) => setNewProject({ ...newProject, outline_text: e.target.value })}
              rows={4}
              required
              disabled={loading}
            />
          </div>

          {/* AI Comment Generation Section */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">AI Topic Comment</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Get an AI-generated comment about your topic to help refine your presentation
            </p>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateComment}
              disabled={generatingComment || !newProject.title || !newProject.outline_text || loading}
              className="w-full"
            >
              {generatingComment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Comment...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Generate AI Comment
                </>
              )}
            </Button>

            {generatedComment && (
              <div className="mt-3 p-3 bg-background rounded-md border">
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">AI Comment:</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {generatedComment}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
