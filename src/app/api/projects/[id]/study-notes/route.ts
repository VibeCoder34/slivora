import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deductTokens } from '@/lib/token-system';
import { generateStudyNotes } from '@/lib/llm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Load project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id, slide_plan, study_notes_md, language')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Gate by plan: require pro/business/enterprise
    const { data: userRow } = await supabase
      .from('users')
      .select('subscription_plan')
      .eq('id', user.id)
      .single();
    const plan = (userRow?.subscription_plan as string) || 'free';
    if (!['pro', 'business', 'enterprise'].includes(plan)) {
      return NextResponse.json({ error: 'Study notes are available for Pro plans' }, { status: 403 });
    }

    // Use cached study notes if available
    if (project.study_notes_md) {
      return new NextResponse(project.study_notes_md, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="study-notes-${projectId}.md"`
        }
      });
    }

    // Generate on-demand if not available
    const notes = await generateStudyNotes(project.slide_plan, project.language || 'en');
    const markdown = notes.markdown;

    // Save to project
    await supabase
      .from('projects')
      .update({ study_notes_md: markdown })
      .eq('id', projectId);

    // Deduct tokens
    await deductTokens(user.id, 'generate_study_notes', projectId, { slideCount: project.slide_plan?.slides?.length || 0 });

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="study-notes-${projectId}.md"`
      }
    });
  } catch (error) {
    console.error('Study notes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


