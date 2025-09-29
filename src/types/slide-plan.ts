import { z } from 'zod';

// Slide layout types
export const SlideLayoutSchema = z.enum(['title', 'title-bullets', 'section', 'quote', 'image']);
export type SlideLayout = z.infer<typeof SlideLayoutSchema>;

// Individual slide schema
export const SlideSchema = z.object({
  id: z.string().min(1, 'Slide ID is required'),
  title: z.string().min(1, 'Title is required').max(60, 'Title must be 60 characters or less'),
  bullets: z.array(z.string().min(1, 'Bullet cannot be empty').max(120, 'Bullet must be 120 characters or less'))
    .max(6, 'Maximum 6 bullets allowed')
    .optional(),
  speakerNotes: z.string().max(2000, 'Speaker notes must be 2000 characters or less').optional(),
  layout: SlideLayoutSchema.default('title-bullets').optional(),
}).refine(
  (data) => {
    // If layout is 'title-bullets', bullets must be provided
    if (data.layout === 'title-bullets' && (!data.bullets || data.bullets.length === 0)) {
      return false;
    }
    return true;
  },
  {
    message: 'Bullets are required for title-bullets layout',
    path: ['bullets'],
  }
);

export type Slide = z.infer<typeof SlideSchema>;

// Complete slide plan schema
export const SlidePlanSchema = z.object({
  projectTitle: z.string().min(1, 'Project title is required').max(120, 'Project title must be 120 characters or less'),
  language: z.string().min(2, 'Language must be at least 2 characters').max(40, 'Language must be 40 characters or less'),
  slides: z.array(SlideSchema).min(3, 'Minimum 3 slides required').max(30, 'Maximum 30 slides allowed'),
});

export type SlidePlan = z.infer<typeof SlidePlanSchema>;

// API request schemas
export const GenerateRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120, 'Title must be 120 characters or less'),
  language: z.string().min(2, 'Language must be at least 2 characters').max(40, 'Language must be 40 characters or less'),
  outline: z.string().min(1, 'Outline is required'),
  theme: z.string().min(1, 'Theme is required').optional(),
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

// Error response schema
export const ErrorResponseSchema = z.object({
  error: z.string(),
  issues: z.array(z.string()).optional(),
  retryAfterSeconds: z.number().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Validation error helper
export function formatValidationErrors(error: z.ZodError): string[] {
  return error.errors.map(err => {
    const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
    return `${path}${err.message}`;
  });
}
