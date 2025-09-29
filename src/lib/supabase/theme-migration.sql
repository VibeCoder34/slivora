-- Theme Migration Script
-- Run this in your Supabase SQL editor to update the theme column

-- Update the default value for the theme column
ALTER TABLE public.projects 
ALTER COLUMN theme SET DEFAULT 'minimal';

-- Update existing projects that have 'default' theme to 'minimal'
UPDATE public.projects 
SET theme = 'minimal' 
WHERE theme = 'default' OR theme IS NULL;

-- Add a check constraint to ensure only valid themes are used
ALTER TABLE public.projects 
ADD CONSTRAINT check_valid_theme 
CHECK (theme IN ('minimal', 'modern', 'corporate', 'colorful', 'creative', 'cosmic', 'neon', 'sunset'));

-- Optional: Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_theme ON public.projects(theme);
