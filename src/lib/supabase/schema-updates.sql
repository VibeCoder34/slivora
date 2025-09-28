-- Additional schema updates for AI Presentation Generator
-- Run these in your Supabase SQL editor after the main schema

-- Add additional columns to projects table for better tracking
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS slide_plan JSONB,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add index for slide_plan queries
CREATE INDEX IF NOT EXISTS idx_projects_slide_plan ON public.projects USING GIN (slide_plan);

-- Add index for updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at DESC);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE OR REPLACE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add a table for tracking API usage (optional, for analytics)
CREATE TABLE IF NOT EXISTS public.api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on api_usage table
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- RLS policy for api_usage
CREATE POLICY "Users can view own API usage" ON public.api_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert API usage" ON public.api_usage
  FOR INSERT WITH CHECK (true);

-- Index for API usage queries
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON public.api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON public.api_usage(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON public.api_usage(created_at DESC);

-- Add a function to clean up old API usage records (older than 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_api_usage()
RETURNS void AS $$
BEGIN
  DELETE FROM public.api_usage 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for project statistics
CREATE OR REPLACE VIEW public.project_stats AS
SELECT 
  p.user_id,
  COUNT(p.id) as total_projects,
  SUM(p.slide_count) as total_slides,
  AVG(p.slide_count) as avg_slides_per_project,
  MAX(p.created_at) as last_project_created
FROM public.projects p
GROUP BY p.user_id;

-- Grant access to the view
GRANT SELECT ON public.project_stats TO authenticated;
