# Database Migration Guide

## Problem
The AI Presentation Generator requires additional database columns to store slide plans and project status. If you're getting errors when creating presentations, you need to run this migration.

## Solution
Run the following SQL in your Supabase SQL Editor:

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the SQL below
4. Click "Run"

## Migration SQL

```sql
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
```

## What This Migration Does

1. **Adds new columns to the `projects` table:**
   - `status`: Tracks project state (draft, generating, ready, error)
   - `slide_plan`: Stores the complete AI-generated slide plan as JSON
   - `slides_count`: Number of slides in the project
   - `last_generated_at`: Timestamp of last successful generation
   - `generate_error`: Error message if generation failed
   - `pptx_url`: URL to exported PowerPoint file
   - `export_count`: Number of times the project has been exported

2. **Creates indexes** for better query performance

3. **Sets up Supabase Storage** for PowerPoint file uploads with proper security policies

4. **Updates existing projects** to have the correct status

## After Migration

1. Refresh your application dashboard
2. The migration warning should disappear
3. You should now be able to create AI-generated presentations successfully
4. All new features (status tracking, PowerPoint export, etc.) will work

## Troubleshooting

If you still see errors after running the migration:

1. Check that all columns were created successfully
2. Verify that the storage bucket was created
3. Make sure your environment variables are set correctly
4. Check the browser console for any remaining errors

## Verification

You can verify the migration worked by:

1. Going to `/api/migrate` in your browser (while logged in)
2. You should see `{"migrationNeeded": false, "message": "Database is up to date"}`
3. Try creating a new project - it should work without errors
