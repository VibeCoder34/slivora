# SLIVORA Token-Based Pricing System

This document provides a comprehensive overview of the token-based pricing system implemented for SLIVORA, an AI-powered presentation generator.

## Overview

The token system allows users to perform various actions in the application by consuming tokens. Each action has a specific token cost, and users can either use their monthly token allowance or purchase additional tokens.

## Architecture

### Core Components

1. **Pricing Configuration** (`src/lib/config/pricing.ts`)
   - Defines subscription plans, token costs, and top-up packages
   - Easily configurable for business changes

2. **Token System Core** (`src/lib/token-system.ts`)
   - Core functions for token management
   - Database operations for token tracking

3. **Database Schema** (`src/lib/supabase/token-schema.sql`)
   - User token fields
   - Token usage tracking
   - Transaction history
   - Billing cycles

4. **UI Components**
   - `TokenUsage` - Dashboard widget showing token status
   - `TokenUpgradeModal` - Modal for plan upgrades and token purchases
   - `TokenInsufficientModal` - Modal shown when user lacks tokens

5. **API Endpoints**
   - `GET /api/tokens` - Get user token information
   - `POST /api/tokens` - Purchase token top-ups
   - `PUT /api/tokens` - Update subscription plan

## Subscription Plans

| Plan | Price | Monthly Tokens | Rollover | Features |
|------|-------|----------------|----------|----------|
| Free | $0 | 50 | 0% | Basic features |
| Pro | $19 | 500 | 10% | Premium features |
| Business | $49 | 2,500 | 15% | Team features |
| Enterprise | $99 | 10,000 | 20% | Enterprise features |

## Token Costs

| Action | Tokens | Description |
|--------|--------|-------------|
| Create Presentation | 10 | Generate new presentation with AI |
| Add/Edit Slide | 1 | Modify slide content |
| Export Presentation | 3 | Export to PDF/PPTX/Video |
| Generate Analytics | 8 | Create analytics reports |
| Regenerate Slides | 10 | Regenerate presentation content |

## Token Top-Up Packages

| Package | Tokens | Price | Price per Token |
|---------|--------|-------|-----------------|
| Small | 100 | $4 | $0.040 |
| Popular | 500 | $20 | $0.040 |
| Value | 1,000 | $35 | $0.035 |
| Enterprise | 2,500 | $75 | $0.030 |

## Database Schema

### Users Table Updates
```sql
ALTER TABLE public.users 
ADD COLUMN subscription_plan TEXT DEFAULT 'free',
ADD COLUMN current_tokens INTEGER DEFAULT 50,
ADD COLUMN rollover_tokens INTEGER DEFAULT 0,
ADD COLUMN tokens_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN total_tokens_used INTEGER DEFAULT 0,
ADD COLUMN subscription_status TEXT DEFAULT 'active';
```

### New Tables

#### token_usage
Tracks all token-consuming actions:
- `user_id` - User who performed the action
- `action_type` - Type of action (create_presentation, export, etc.)
- `tokens_consumed` - Number of tokens used
- `project_id` - Related project (if applicable)
- `metadata` - Additional action data
- `created_at` - Timestamp

#### token_transactions
Records token purchases and adjustments:
- `user_id` - User receiving tokens
- `transaction_type` - purchase, subscription, bonus, refund, admin_adjustment
- `tokens_amount` - Number of tokens added
- `amount_paid` - Payment amount
- `payment_provider` - Payment system used
- `payment_reference` - External payment reference

#### billing_cycles
Tracks monthly billing periods:
- `user_id` - User
- `cycle_start/cycle_end` - Billing period dates
- `tokens_allocated` - Tokens given for the period
- `tokens_used` - Tokens consumed
- `tokens_rolled_over` - Tokens carried over
- `subscription_plan` - Plan for the period

## Core Functions

### Token Checking
```typescript
const tokenCheck = await checkUserTokens(userId, actionType, projectId?)
```

### Token Deduction
```typescript
const result = await deductTokens(userId, actionType, projectId?, metadata?)
```

### User Token Info
```typescript
const tokenInfo = await getUserTokenInfo(userId)
```

### Token Purchase
```typescript
const result = await purchaseTokens(userId, packageId, paymentReference?, paymentProvider?)
```

### Subscription Update
```typescript
const result = await updateUserSubscription(userId, plan, subscriptionId?, stripeCustomerId?)
```

## Integration Points

### API Routes
All major API routes now include token checking:

1. **Create Project** (`/api/projects/create-and-generate`)
   - Checks tokens before generation
   - Deducts 10 tokens on success

2. **Export Project** (`/api/projects/[id]/export`)
   - Checks tokens before export
   - Deducts 3 tokens on success

3. **Regenerate Project** (`/api/projects/[id]/generate`)
   - Checks tokens before regeneration
   - Deducts 10 tokens on success

### Frontend Integration

#### Dashboard
- Token usage widget showing current status
- Progress bar for monthly usage
- Quick access to upgrade/purchase options

#### Modals
- **Insufficient Tokens Modal**: Shown when user lacks tokens for an action
- **Upgrade Modal**: Allows plan upgrades and token purchases

#### Hooks
- `useTokens()` - Manages token state and operations
- Automatic refresh after token-consuming actions

## Error Handling

### Insufficient Tokens
When a user lacks tokens for an action:
1. API returns 402 Payment Required status
2. Frontend shows insufficient tokens modal
3. User can upgrade plan or purchase tokens

### Token Deduction Failures
- Logged for monitoring
- Don't block the user action
- Can be manually adjusted later

## Configuration

### Adjusting Token Costs
Edit `src/lib/config/pricing.ts`:
```typescript
export const TOKEN_COSTS: Record<ActionType, TokenCostConfig> = {
  create_presentation: {
    action: 'create_presentation',
    tokens: 10, // Change this value
    description: 'Create new presentation'
  },
  // ... other actions
};
```

### Adding New Actions
1. Add action type to `ActionType` enum
2. Add token cost to `TOKEN_COSTS`
3. Update database enum in token-schema.sql
4. Integrate into relevant API routes

### Modifying Plans
Edit subscription plans in `SUBSCRIPTION_PLANS`:
```typescript
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, SubscriptionPlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    monthlyTokens: 50, // Adjust token allowance
    rolloverPercentage: 0, // Adjust rollover
    features: [
      '50 tokens per month',
      // ... other features
    ]
  },
  // ... other plans
};
```

## Monitoring and Analytics

### Token Usage Statistics
- Total tokens used per user
- Monthly usage patterns
- Most common actions
- Average tokens per day

### Database Functions
- `log_token_usage()` - Records token consumption
- `check_user_tokens()` - Validates token availability
- `deduct_user_tokens()` - Safely deducts tokens
- `add_user_tokens()` - Adds tokens (purchases, bonuses)

## Security Considerations

### Row Level Security (RLS)
- Users can only access their own token data
- System functions have elevated privileges
- All token operations are logged

### Token Validation
- Server-side validation for all token operations
- Atomic operations to prevent race conditions
- Proper error handling and rollback

## Future Enhancements

### Planned Features
1. **Payment Gateway Integration**
   - Stripe integration for subscriptions
   - Automated billing cycles
   - Payment failure handling

2. **Advanced Analytics**
   - Usage forecasting
   - Cost optimization recommendations
   - Team usage reports

3. **Enterprise Features**
   - Team token pools
   - Admin token management
   - Custom billing

4. **Token Bonuses**
   - Referral bonuses
   - Achievement rewards
   - Promotional campaigns

## Deployment Checklist

### Database Setup
1. Run token-schema.sql in Supabase
2. Update user table with new columns
3. Set up RLS policies
4. Create database functions

### Environment Variables
```env
# Add these if using payment providers
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Testing
1. Test token deduction flows
2. Verify insufficient token handling
3. Test plan upgrade scenarios
4. Validate token rollover logic

## Support and Maintenance

### Monitoring
- Track token usage patterns
- Monitor failed token deductions
- Watch for unusual usage spikes

### Common Issues
1. **Token not deducted**: Check database function permissions
2. **Insufficient tokens not caught**: Verify API integration
3. **Rollover not working**: Check billing cycle logic

### Maintenance Tasks
- Monthly token resets
- Cleanup old usage records
- Update token costs based on usage
- Monitor payment failures

## Conclusion

The token-based pricing system provides a flexible, scalable approach to monetizing SLIVORA while giving users clear visibility into their usage. The modular design allows for easy adjustments to pricing, features, and business logic as the platform grows.
