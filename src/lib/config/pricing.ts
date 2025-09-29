/**
 * Configurable pricing and token system for SLIVORA
 * 
 * This file contains all subscription plans, token costs, and top-up packages.
 * Modify values here to adjust pricing without touching core logic.
 */

export type SubscriptionPlan = 'free' | 'pro' | 'business' | 'enterprise';

export type ActionType = 
  | 'create_presentation'
  | 'add_edit_slide'
  | 'export_presentation'
  | 'generate_analytics'
  | 'regenerate_slides';

export interface SubscriptionPlanConfig {
  id: SubscriptionPlan;
  name: string;
  price: number; // Monthly price in USD
  monthlyTokens: number;
  rolloverPercentage: number; // Percentage of unused tokens that rollover
  features: string[];
  popular?: boolean;
  stripeProductId?: string; // For future payment integration
  availableThemes: string[]; // List of theme keys available for this plan
}

export interface TokenCostConfig {
  action: ActionType;
  tokens: number;
  description: string;
}

export interface TokenTopUpPackage {
  id: string;
  tokens: number;
  price: number; // USD
  popular?: boolean;
  description: string;
  stripeProductId?: string; // For future payment integration
}

// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, SubscriptionPlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    monthlyTokens: 50,
    rolloverPercentage: 0, // Free plan gets no rollover
    features: [
      '50 tokens per month',
      'Create presentations',
      'Export to PDF',
      '2 presentation themes',
      'Community support'
    ],
    availableThemes: ['minimal', 'modern'] // Free users get only 2 themes
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 19,
    monthlyTokens: 500,
    rolloverPercentage: 10,
    features: [
      '500 tokens per month',
      '10% token rollover',
      'All export formats',
      'All 5 presentation themes',
      'Priority support',
      'Custom branding'
    ],
    popular: true,
    stripeProductId: 'price_pro_monthly',
    availableThemes: ['minimal', 'modern', 'corporate', 'colorful', 'creative'] // Pro users get all themes
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 49,
    monthlyTokens: 2500,
    rolloverPercentage: 15,
    features: [
      '2,500 tokens per month',
      '15% token rollover',
      'Everything in Pro',
      'Team collaboration',
      'Advanced analytics',
      'API access',
      'Dedicated support'
    ],
    stripeProductId: 'price_business_monthly',
    availableThemes: ['minimal', 'modern', 'corporate', 'colorful', 'creative'] // Business users get all themes
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    monthlyTokens: 10000,
    rolloverPercentage: 20,
    features: [
      '10,000 tokens per month',
      '20% token rollover',
      'Everything in Business',
      'White-label options',
      'Custom integrations',
      'SLA guarantee',
      '24/7 phone support'
    ],
    stripeProductId: 'price_enterprise_monthly',
    availableThemes: ['minimal', 'modern', 'corporate', 'colorful', 'creative'] // Enterprise users get all themes
  }
};

// Token Cost Configuration
export const TOKEN_COSTS: Record<ActionType, TokenCostConfig> = {
  create_presentation: {
    action: 'create_presentation',
    tokens: 10,
    description: 'Create new presentation'
  },
  add_edit_slide: {
    action: 'add_edit_slide',
    tokens: 1,
    description: 'Add or edit slide content'
  },
  export_presentation: {
    action: 'export_presentation',
    tokens: 3,
    description: 'Export presentation (PDF/PPTX/Video)'
  },
  generate_analytics: {
    action: 'generate_analytics',
    tokens: 8,
    description: 'Generate analytics and reports'
  },
  regenerate_slides: {
    action: 'regenerate_slides',
    tokens: 10,
    description: 'Regenerate presentation slides'
  }
};

// Token Top-Up Packages
export const TOKEN_TOP_UP_PACKAGES: TokenTopUpPackage[] = [
  {
    id: 'topup_100',
    tokens: 100,
    price: 4,
    description: 'Perfect for occasional use',
    popular: false
  },
  {
    id: 'topup_500',
    tokens: 500,
    price: 20,
    description: 'Most popular top-up',
    popular: true,
    stripeProductId: 'price_topup_500'
  },
  {
    id: 'topup_1000',
    tokens: 1000,
    price: 35,
    description: 'Best value for heavy users',
    popular: false,
    stripeProductId: 'price_topup_1000'
  },
  {
    id: 'topup_2500',
    tokens: 2500,
    price: 75,
    description: 'Enterprise-level top-up',
    popular: false,
    stripeProductId: 'price_topup_2500'
  }
];

// Helper functions
export function getPlanConfig(planId: SubscriptionPlan): SubscriptionPlanConfig {
  return SUBSCRIPTION_PLANS[planId];
}

export function getActionCost(action: ActionType): number {
  return TOKEN_COSTS[action].tokens;
}

export function getTopUpPackage(packageId: string): TokenTopUpPackage | undefined {
  return TOKEN_TOP_UP_PACKAGES.find(pkg => pkg.id === packageId);
}

export function calculateRolloverTokens(usedTokens: number, monthlyTokens: number, rolloverPercentage: number): number {
  const unusedTokens = Math.max(0, monthlyTokens - usedTokens);
  return Math.floor(unusedTokens * (rolloverPercentage / 100));
}

export function getAvailableTokens(currentTokens: number, rolloverTokens: number, monthlyTokens: number): number {
  return currentTokens + rolloverTokens + monthlyTokens;
}

export function isThemeAvailableForPlan(themeKey: string, planId: SubscriptionPlan): boolean {
  const plan = SUBSCRIPTION_PLANS[planId];
  return plan.availableThemes.includes(themeKey);
}

export function getAvailableThemesForPlan(planId: SubscriptionPlan): string[] {
  return SUBSCRIPTION_PLANS[planId].availableThemes;
}

// Default plan for new users
export const DEFAULT_PLAN: SubscriptionPlan = 'free';

// Token system constants
export const TOKEN_SYSTEM_CONFIG = {
  // Billing cycle settings
  BILLING_CYCLE_DAYS: 30,
  
  // Token limits
  MAX_TOKENS_PER_MONTH: 50000, // Hard limit for safety
  MIN_TOKENS_FOR_ACTION: 1,
  
  // Rollover settings
  MAX_ROLLOVER_PERCENTAGE: 50, // Maximum rollover percentage allowed
  
  // Top-up limits
  MAX_TOP_UP_TOKENS: 10000,
  MIN_TOP_UP_TOKENS: 10,
  
  // System settings
  TOKEN_EXPIRY_DAYS: 365, // Tokens expire after 1 year
  GRACE_PERIOD_HOURS: 24, // Grace period when tokens run out
} as const;
