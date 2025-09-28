# Supabase Integration Setup Guide

This guide will help you set up Supabase authentication and database for your AI Presentation Generator.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Node.js and npm installed
3. This project cloned and dependencies installed

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `aipresentationgenerator` (or your preferred name)
   - Database Password: Choose a strong password
   - Region: Choose the closest to your users
5. Click "Create new project"
6. Wait for the project to be set up (usually 2-3 minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)
   - **Service Role Key** (starts with `eyJ...`, keep this secret!)

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and replace the placeholder values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

## Step 4: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire contents of `src/lib/supabase/schema.sql`
3. Paste it into the SQL editor
4. Click **Run** to execute the schema

This will create:
- `users` table with user profiles
- `projects` table for presentations
- `slides` table for individual slides
- `payments` table for subscription management
- Row Level Security (RLS) policies
- Automatic user profile creation trigger

## Step 5: Configure Authentication

1. In your Supabase dashboard, go to **Authentication** > **Settings**
2. Under **Site URL**, add your development URL:
   ```
   http://localhost:3000
   ```
3. Under **Redirect URLs**, add:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/dashboard
   ```

## Step 6: Enable Email Authentication

1. In **Authentication** > **Settings** > **Auth Providers**
2. Make sure **Email** is enabled
3. Configure email templates if needed (optional for development)

## Step 7: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000)

3. Click "Get started" to go to the auth page

4. Try creating a new account:
   - Enter your email and password
   - Check your email for verification (if email verification is enabled)
   - Sign in with your credentials

5. You should be redirected to the dashboard where you can:
   - Create new projects
   - View existing projects
   - Manage slides

## Step 8: Production Setup

When deploying to production:

1. Update your Supabase project settings:
   - Add your production domain to **Site URL**
   - Add production redirect URLs
   - Configure email templates for production

2. Update your environment variables in your hosting platform:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Database Schema Overview

### Tables Created

- **users**: Extended user profiles (id, email, name, created_at)
- **projects**: Presentation projects (id, user_id, title, outline_text, language, theme, slide_count, created_at)
- **slides**: Individual slides (id, project_id, slide_number, content, created_at)
- **payments**: Payment/subscription tracking (id, user_id, provider, plan, status, created_at)

### Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Automatic user creation**: User profiles are created automatically on signup
- **Secure authentication**: JWT-based sessions with automatic refresh

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**: Check that your environment variables are correct
2. **"User not found" error**: Make sure the database schema was created successfully
3. **Redirect loops**: Check that your redirect URLs are configured correctly in Supabase

### Debug Steps

1. Check browser console for errors
2. Verify environment variables are loaded: `console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)`
3. Check Supabase logs in the dashboard under **Logs**
4. Ensure RLS policies are enabled and working

## Next Steps

Once basic authentication is working, you can:

1. Add social login providers (Google, GitHub)
2. Implement email verification
3. Add password reset functionality
4. Create more sophisticated project management features
5. Add AI integration for content generation

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Discord Community](https://discord.supabase.com)
