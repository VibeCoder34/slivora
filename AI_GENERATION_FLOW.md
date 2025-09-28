# AI Presentation Generation Flow

This document explains the new AI-powered presentation generation flow that has been integrated into the application.

## Overview

The application now supports end-to-end AI presentation generation with the following workflow:

1. **Create & Generate**: Users create a project and immediately trigger AI slide generation
2. **Regenerate**: Users can regenerate slides for existing projects
3. **Export**: Users can export presentations as PowerPoint (.pptx) files
4. **Status Tracking**: Real-time status updates throughout the generation process

## Database Schema Updates

### New Project Columns

The `projects` table has been extended with the following columns:

- `status`: Project status (`'draft' | 'generating' | 'ready' | 'error'`)
- `slide_plan`: JSONB field storing the complete AI-generated slide plan
- `slides_count`: Number of slides in the generated plan
- `last_generated_at`: Timestamp of last successful generation
- `generate_error`: Error message if generation failed
- `pptx_url`: URL to the exported PowerPoint file
- `export_count`: Number of times the project has been exported

### Storage

- **Supabase Storage Bucket**: `decks` (private bucket for security)
- **File Organization**: Files stored as `{user_id}/{slug}-{project_id}.pptx`
- **Permissions**: Users can only access their own files via RLS

## API Endpoints

### 1. Create and Generate Project

**POST** `/api/projects/create-and-generate`

Creates a new project and immediately generates AI slides.

**Request Body:**
```json
{
  "title": "Project Title",
  "outline_text": "Detailed presentation outline",
  "language": "en"
}
```

**Response:**
```json
{
  "project": { /* Project object with generated data */ },
  "plan": { /* SlidePlan object */ },
  "remaining": 4
}
```

**Rate Limiting:** 5 requests per 10 minutes per user

### 2. Regenerate Project

**POST** `/api/projects/[id]/generate`

Regenerates slides for an existing project.

**Response:**
```json
{
  "project": { /* Updated project object */ },
  "plan": { /* New SlidePlan object */ },
  "remaining": 4
}
```

**Rate Limiting:** 5 requests per 10 minutes per user

### 3. Export Project

**POST** `/api/projects/[id]/export`

Exports the project as a PowerPoint file and uploads to storage.

**Response:**
```json
{
  "url": "https://storage-url/decks/user-id/filename.pptx",
  "filename": "project-title-project-id.pptx",
  "remaining": 2
}
```

**Rate Limiting:** 3 requests per 10 minutes per user

## UI Components

### Status Badge

The `StatusBadge` component displays project status with appropriate colors:

- **Draft**: Gray - Project created but no slides generated
- **Generating**: Blue - AI is currently generating slides
- **Ready**: Green - Slides generated successfully
- **Error**: Red - Generation failed with error message

### Dashboard Updates

- Project cards show status badges
- Action buttons based on project status:
  - **Ready**: Regenerate, Export PPTX
  - **Error**: Retry Generation
  - **Generating**: Loading state with disabled actions
- Real-time status updates

### Project Detail Page

- Status-aware header with appropriate action buttons
- AI-generated slides displayed with proper formatting
- Support for both AI-generated and manual slides
- Export functionality with direct download

## Error Handling

### Validation Errors (422)
- Input validation using Zod schemas
- Clear error messages for invalid data

### Rate Limiting (429)
- User-specific rate limiting
- Retry-after headers for client-side handling

### Generation Errors (500)
- Projects marked as 'error' status
- Error messages stored in `generate_error` field
- Retry functionality available

### Authentication (401)
- Supabase RLS ensures users can only access their own projects
- All endpoints require authentication

## Security

- **Row Level Security (RLS)**: All database operations respect user ownership
- **Rate Limiting**: Prevents abuse of AI generation and export endpoints
- **Private Storage**: PowerPoint files stored in private bucket with user-specific access
- **Input Validation**: All inputs validated with Zod schemas

## Usage Examples

### Creating a New Project

```typescript
const { data, error } = await createProjectWithAI({
  title: "Q4 Sales Review",
  outline_text: "Review Q4 performance, key metrics, challenges, and next steps",
  language: "en"
});
```

### Regenerating Slides

```typescript
const { data, error } = await regenerateProject(projectId);
```

### Exporting to PowerPoint

```typescript
const { data, error } = await exportProject(projectId);
if (data?.url) {
  window.open(data.url, '_blank');
}
```

## Migration Instructions

1. **Run Database Migration**: Execute the SQL in `src/lib/supabase/project-migration.sql`
2. **Update Environment**: Ensure all required environment variables are set
3. **Deploy**: Deploy the updated application
4. **Test**: Verify all flows work correctly

## Monitoring

- Rate limit usage tracked per user
- Generation success/failure rates
- Export counts per project
- Error tracking for debugging

This implementation provides a complete AI-powered presentation generation system with proper error handling, security, and user experience considerations.
