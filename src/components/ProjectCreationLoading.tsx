"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  Sparkles, 
  CheckCircle, 
  AlertCircle,
  RefreshCw
} from "lucide-react";

interface ProjectCreationLoadingProps {
  projectId: string;
  projectTitle: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export function ProjectCreationLoading({
  projectId,
  projectTitle,
  onComplete,
  onError
}: ProjectCreationLoadingProps) {
  const router = useRouter();
  const [status, setStatus] = React.useState<'generating' | 'ready' | 'error'>('generating');
  const [error, setError] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [currentStep, setCurrentStep] = React.useState(0);

  const steps = [
    "Analyzing your presentation outline...",
    "Generating slide structure and content...",
    "Creating engaging visuals and layouts...",
    "Finalizing your presentation...",
    "Almost ready!"
  ];

  // Polling function to check project status
  const checkProjectStatus = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project status');
      }
      
      const data = await response.json();
      const project = data.project;
      
      if (project) {
        setStatus(project.status);
        
        if (project.status === 'ready') {
          setProgress(100);
          setCurrentStep(steps.length - 1);
          // Call onComplete callback if provided
          if (onComplete) {
            onComplete();
          }
          // Auto-redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        } else if (project.status === 'error') {
          setError(project.generate_error || 'An error occurred during generation');
          if (onError) {
            onError(project.generate_error || 'An error occurred during generation');
          }
        } else if (project.status === 'generating') {
          // Update progress based on time elapsed (rough estimation)
          const elapsed = Date.now() - new Date(project.created_at).getTime();
          const estimatedTotal = 30000; // 30 seconds estimated total time
          const progressPercent = Math.min((elapsed / estimatedTotal) * 100, 90);
          setProgress(progressPercent);
          
          // Update current step based on progress
          const stepIndex = Math.min(Math.floor((progressPercent / 100) * steps.length), steps.length - 1);
          setCurrentStep(stepIndex);
        }
      }
    } catch (err) {
      console.error('Error checking project status:', err);
      setError('Failed to check project status');
      if (onError) {
        onError('Failed to check project status');
      }
    }
  }, [projectId, onComplete, onError, router, steps.length]);

  // Start polling when component mounts
  React.useEffect(() => {
    const interval = setInterval(checkProjectStatus, 2000); // Check every 2 seconds
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [checkProjectStatus]);

  // Handle retry
  const handleRetry = () => {
    setStatus('generating');
    setError(null);
    setProgress(0);
    setCurrentStep(0);
    checkProjectStatus();
  };

  if (status === 'error') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Generation Failed</h2>
          <p className="text-muted-foreground mb-6">
            We encountered an error while creating your presentation
          </p>
          <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20 mb-6">
            <p className="text-sm text-red-800 dark:text-red-200">
              {error || 'An unknown error occurred'}
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 border border-input bg-background hover:bg-accent rounded-md"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'ready') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Presentation Ready!</h2>
          <p className="text-muted-foreground mb-6">
            Your presentation has been successfully generated
          </p>
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Redirecting you to the dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-10 w-10 text-primary animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Creating Your Presentation</h2>
        <p className="text-muted-foreground mb-8">
          AI is working hard to generate: <strong>{projectTitle}</strong>
        </p>

        {/* Progress Bar */}
        <div className="space-y-3 mb-8">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div 
              className="bg-primary h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-lg font-medium">
              {steps[currentStep] || steps[0]}
            </span>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-3 text-left">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`flex items-center gap-3 text-sm ${
                index <= currentStep 
                  ? 'text-primary' 
                  : 'text-muted-foreground'
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${
                index < currentStep 
                  ? 'bg-primary' 
                  : index === currentStep 
                  ? 'bg-primary animate-pulse' 
                  : 'bg-muted'
              }`} />
              <span>{step}</span>
            </div>
          ))}
        </div>

        {/* Estimated Time */}
        <div className="mt-8">
          <p className="text-sm text-muted-foreground">
            This usually takes 30-60 seconds
          </p>
        </div>
      </div>
    </div>
  );
}
