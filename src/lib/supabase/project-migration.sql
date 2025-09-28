-- Project Status and AI Generation Migration
-- Run this in your Supabase SQL editor to add the required columns

-- Add new columns to projects table for AI generation flow
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'ready', 'error')),
ADD COLUMN IF NOT EXISTS slide_plan JSONB,
ADD COLUMN IF NOT EXISTS slides_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS generate_error TEXT,
ADD COLUMN IF NOT EXISTS pptx_url TEXT,
ADD COLUMN IF NOT EXISTS export_count INTEGER DEFAULT 0;

-- Create index on status for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

-- Create index on last_generated_at for sorting
CREATE INDEX IF NOT EXISTS idx_projects_last_generated_at ON public.projects(last_generated_at DESC);

-- Update existing projects to have 'ready' status if they have slide_plan
UPDATE public.projects 
SET status = 'ready', 
    slides_count = slide_count,
    last_generated_at = created_at
WHERE slide_plan IS NOT NULL;

-- Create Supabase Storage bucket for PowerPoint files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'decks',
  'decks', 
  false, -- Private bucket for security
  52428800, -- 50MB limit
  ARRAY['application/vnd.openxmlformats-officedocument.presentationml.presentation']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policy for authenticated users to upload their own files
CREATE POLICY "Users can upload their own deck files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'decks' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policy for authenticated users to view their own files
CREATE POLICY "Users can view their own deck files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'decks' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policy for authenticated users to delete their own files
CREATE POLICY "Users can delete their own deck files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'decks' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policy for authenticated users to update their own files
CREATE POLICY "Users can update their own deck files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'decks' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
