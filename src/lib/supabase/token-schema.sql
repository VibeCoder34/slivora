-- Token System Database Schema Updates
-- Run this in your Supabase SQL editor to add token system support

-- Add token-related columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'business', 'enterprise')),
ADD COLUMN IF NOT EXISTS current_tokens INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS rollover_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tokens_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS total_tokens_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'trialing')),
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_id TEXT;

-- Create token_usage table to track all token consumption
CREATE TABLE IF NOT EXISTS public.token_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('create_presentation', 'add_edit_slide', 'export_presentation', 'generate_analytics', 'regenerate_slides')),
  tokens_consumed INTEGER NOT NULL CHECK (tokens_consumed > 0),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create token_transactions table for token purchases and adjustments
CREATE TABLE IF NOT EXISTS public.token_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'subscription', 'bonus', 'refund', 'admin_adjustment')),
  tokens_amount INTEGER NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  payment_provider TEXT,
  payment_reference TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create billing_cycles table to track monthly billing
CREATE TABLE IF NOT EXISTS public.billing_cycles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  cycle_start TIMESTAMP WITH TIME ZONE NOT NULL,
  cycle_end TIMESTAMP WITH TIME ZONE NOT NULL,
  tokens_allocated INTEGER NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  tokens_rolled_over INTEGER DEFAULT 0,
  subscription_plan TEXT NOT NULL,
  amount_billed DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on new tables
ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_cycles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for token_usage table
CREATE POLICY "Users can view own token usage" ON public.token_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert token usage" ON public.token_usage
  FOR INSERT WITH CHECK (true); -- This will be restricted by application logic

-- RLS Policies for token_transactions table
CREATE POLICY "Users can view own token transactions" ON public.token_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert token transactions" ON public.token_transactions
  FOR INSERT WITH CHECK (true); -- This will be restricted by application logic

-- RLS Policies for billing_cycles table
CREATE POLICY "Users can view own billing cycles" ON public.billing_cycles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert billing cycles" ON public.billing_cycles
  FOR INSERT WITH CHECK (true); -- This will be restricted by application logic

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON public.token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON public.token_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_token_usage_action_type ON public.token_usage(action_type);
CREATE INDEX IF NOT EXISTS idx_token_usage_project_id ON public.token_usage(project_id);

CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON public.token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON public.token_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_token_transactions_type ON public.token_transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_billing_cycles_user_id ON public.billing_cycles(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_start ON public.billing_cycles(cycle_start);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_status ON public.billing_cycles(status);

-- Create function to reset user tokens for new billing cycle
CREATE OR REPLACE FUNCTION public.reset_user_tokens()
RETURNS TRIGGER AS $$
BEGIN
  -- Only reset if the subscription_plan has changed or if it's a new user
  IF OLD.subscription_plan IS DISTINCT FROM NEW.subscription_plan THEN
    -- Get the monthly token allocation for the new plan
    CASE NEW.subscription_plan
      WHEN 'free' THEN
        NEW.current_tokens := 50;
        NEW.rollover_tokens := 0;
      WHEN 'pro' THEN
        NEW.current_tokens := 500;
        NEW.rollover_tokens := GREATEST(0, FLOOR(OLD.current_tokens * 0.1));
      WHEN 'business' THEN
        NEW.current_tokens := 2500;
        NEW.rollover_tokens := GREATEST(0, FLOOR(OLD.current_tokens * 0.15));
      WHEN 'enterprise' THEN
        NEW.current_tokens := 10000;
        NEW.rollover_tokens := GREATEST(0, FLOOR(OLD.current_tokens * 0.20));
    END CASE;
    
    NEW.tokens_reset_date := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically reset tokens when plan changes
CREATE OR REPLACE TRIGGER on_user_plan_changed
  AFTER UPDATE OF subscription_plan ON public.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.reset_user_tokens();

-- Create function to log token usage
CREATE OR REPLACE FUNCTION public.log_token_usage(
  p_user_id UUID,
  p_action_type TEXT,
  p_tokens_consumed INTEGER,
  p_project_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  usage_id UUID;
BEGIN
  -- Insert token usage record
  INSERT INTO public.token_usage (user_id, action_type, tokens_consumed, project_id, metadata)
  VALUES (p_user_id, p_action_type, p_tokens_consumed, p_project_id, p_metadata)
  RETURNING id INTO usage_id;
  
  -- Update user's total tokens used
  UPDATE public.users 
  SET total_tokens_used = total_tokens_used + p_tokens_consumed
  WHERE id = p_user_id;
  
  RETURN usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has enough tokens
CREATE OR REPLACE FUNCTION public.check_user_tokens(
  p_user_id UUID,
  p_tokens_required INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  available_tokens INTEGER;
BEGIN
  -- Get user's available tokens
  SELECT (current_tokens + rollover_tokens) INTO available_tokens
  FROM public.users
  WHERE id = p_user_id;
  
  -- Return true if user has enough tokens
  RETURN COALESCE(available_tokens, 0) >= p_tokens_required;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to deduct tokens from user
CREATE OR REPLACE FUNCTION public.deduct_user_tokens(
  p_user_id UUID,
  p_tokens_to_deduct INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_tokens_val INTEGER;
  rollover_tokens_val INTEGER;
BEGIN
  -- Get current token balances
  SELECT current_tokens, rollover_tokens 
  INTO current_tokens_val, rollover_tokens_val
  FROM public.users
  WHERE id = p_user_id;
  
  -- Check if user has enough tokens
  IF COALESCE(current_tokens_val, 0) + COALESCE(rollover_tokens_val, 0) < p_tokens_to_deduct THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct from rollover tokens first, then from current tokens
  IF COALESCE(rollover_tokens_val, 0) >= p_tokens_to_deduct THEN
    -- Deduct from rollover tokens only
    UPDATE public.users 
    SET rollover_tokens = rollover_tokens - p_tokens_to_deduct
    WHERE id = p_user_id;
  ELSE
    -- Deduct from both rollover and current tokens
    UPDATE public.users 
    SET 
      rollover_tokens = 0,
      current_tokens = current_tokens - (p_tokens_to_deduct - COALESCE(rollover_tokens_val, 0))
    WHERE id = p_user_id;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to add tokens to user (for purchases, bonuses, etc.)
CREATE OR REPLACE FUNCTION public.add_user_tokens(
  p_user_id UUID,
  p_tokens_to_add INTEGER,
  p_transaction_type TEXT DEFAULT 'bonus'
)
RETURNS UUID AS $$
DECLARE
  transaction_id UUID;
BEGIN
  -- Add tokens to user's current balance
  UPDATE public.users 
  SET current_tokens = current_tokens + p_tokens_to_add
  WHERE id = p_user_id;
  
  -- Log the transaction
  INSERT INTO public.token_transactions (user_id, transaction_type, tokens_amount, description)
  VALUES (p_user_id, p_transaction_type, p_tokens_to_add, 'Tokens added to account')
  RETURNING id INTO transaction_id;
  
  RETURN transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing handle_new_user function to initialize token system
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, subscription_plan, current_tokens, rollover_tokens, tokens_reset_date)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'name',
    'free',
    50, -- Free plan tokens
    0,  -- No rollover for free plan
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
