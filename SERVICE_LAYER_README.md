# AI Presentation Generator - Service Layer

This document describes the service layer implementation for the AI Presentation Generator, providing API endpoints for generating slide plans and exporting PowerPoint presentations.

## 🏗️ Architecture Overview

The service layer consists of:

- **Type System**: Strong typing with Zod validation
- **Rate Limiting**: In-memory sliding window rate limiting
- **LLM Integration**: OpenAI API for slide plan generation
- **PowerPoint Generation**: pptxgenjs for .pptx file creation
- **Database Integration**: Supabase for data persistence
- **API Routes**: RESTful endpoints for frontend integration

## 📁 File Structure

```
src/
├── types/
│   └── slide-plan.ts          # Zod schemas and TypeScript types
├── lib/
│   ├── env.ts                 # Environment variable validation
│   ├── rateLimit.ts           # Rate limiting implementation
│   ├── llm.ts                 # OpenAI integration
│   └── pptx.ts                # PowerPoint generation
└── app/api/
    ├── generate/route.ts      # POST /api/generate
    └── export/route.ts        # POST /api/export
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install pptxgenjs openai zod
```

### 2. Environment Variables

Create a `.env.local` file with:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Optional
NODE_ENV=development
```

### 3. Database Setup

Run the SQL scripts in your Supabase SQL editor:

1. First, run `src/lib/supabase/schema.sql` (if not already done)
2. Then, run `src/lib/supabase/schema-updates.sql` for additional features

## 🚀 API Endpoints

### POST /api/generate

Generates a slide plan from title, language, and outline.

**Request Body:**
```json
{
  "title": "Introduction to AI",
  "language": "en",
  "outline": "• What is AI?\n• History of AI\n• Current applications"
}
```

**Response:**
```json
{
  "projectTitle": "Introduction to AI",
  "language": "en",
  "slides": [
    {
      "id": "slide-1",
      "title": "What is AI?",
      "bullets": ["Definition", "Key concepts"],
      "layout": "title-bullets"
    }
  ],
  "projectId": "uuid-here",
  "remaining": 4
}
```

**Rate Limit:** 5 requests per 10 minutes per IP

### POST /api/export

Generates and downloads a PowerPoint file from a slide plan.

**Request Body:**
```json
{
  "projectTitle": "Introduction to AI",
  "language": "en",
  "slides": [...]
}
```

**Response:** Binary .pptx file with appropriate headers

**Rate Limit:** 3 requests per 10 minutes per IP

## 🎨 Slide Layouts

The system supports four slide layouts:

1. **title**: Centered large title with accent underline
2. **title-bullets**: Left-aligned title with bullet list
3. **section**: Centered accent title for section dividers
4. **quote**: Centered italic text for quotes

## 🎯 Theme Configuration

The PowerPoint theme uses:

- **Fonts**: Inter (fallback: Arial)
- **Colors**: 
  - Background: #FFFFFF
  - Foreground: #1A1A1A
  - Muted: #6B7280
  - Accent: #2563EB
- **Sizes**: Title 36pt, H2 28pt, Bullet 18pt, Caption 12pt
- **Layout**: 16:9 aspect ratio

## 🛡️ Security Features

- **Authentication**: Supabase Auth integration
- **Rate Limiting**: Per-IP sliding window limits
- **Input Validation**: Zod schema validation
- **Error Handling**: Comprehensive error responses
- **Data Isolation**: User-based data access with RLS

## 📊 Error Handling

The API returns structured error responses:

```json
{
  "error": "Error message",
  "issues": ["Specific validation errors"],
  "retryAfterSeconds": 300
}
```

**HTTP Status Codes:**
- `200`: Success
- `401`: Authentication required
- `413`: Too many slides (max 30)
- `422`: Validation error
- `429`: Rate limit exceeded
- `500`: Internal server error

## 🧪 Testing

Run the test script to verify functionality:

```bash
node test-service.js
```

This will test:
1. Slide plan generation
2. Schema validation
3. PowerPoint file creation

## 🔄 Data Flow

1. **Generate Flow:**
   - User submits title, language, outline
   - Rate limit check
   - Authentication check
   - LLM generates slide plan
   - Data stored in Supabase
   - Slide plan returned to frontend

2. **Export Flow:**
   - User submits slide plan
   - Rate limit check
   - Authentication check
   - PowerPoint file generated
   - File streamed to user

## 🚀 Deployment

The service layer is designed to work with:
- **Vercel**: Serverless deployment
- **Node.js**: Local development
- **Supabase**: Database and authentication

## 🔮 Future Enhancements

- **Theme Variants**: Multiple presentation themes
- **Image Integration**: AI-generated images for slides
- **Template Library**: Pre-built slide templates
- **Collaboration**: Real-time editing features
- **Analytics**: Usage tracking and insights

## 📝 Notes

- The rate limiting is in-memory and resets on server restart
- For production with multiple instances, consider Redis-based rate limiting
- All user data is isolated using Supabase Row Level Security
- The system supports 3-30 slides per presentation
- Slide titles are limited to 60 characters, bullets to 120 characters
