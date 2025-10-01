-- Contact Submissions Database Schema
-- Run this in your Supabase SQL editor to add contact form support

-- Create contact_submissions table to store form submissions
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'closed')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_submissions table
-- Only authenticated users can view submissions (for admin purposes)
CREATE POLICY "Authenticated users can view contact submissions" ON public.contact_submissions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow anyone to insert contact submissions (public form)
CREATE POLICY "Anyone can insert contact submissions" ON public.contact_submissions
  FOR INSERT WITH CHECK (true);

-- Only authenticated users can update contact submissions (for admin status updates)
CREATE POLICY "Authenticated users can update contact submissions" ON public.contact_submissions
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_contact_submission_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update updated_at
CREATE OR REPLACE TRIGGER on_contact_submission_updated
  BEFORE UPDATE ON public.contact_submissions
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_contact_submission_updated_at();

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON public.contact_submissions(email);
