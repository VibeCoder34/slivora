import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if slide_plan column exists
    const { data: columnCheck, error: columnError } = await supabase
      .rpc('check_column_exists', {
        table_name: 'projects',
        column_name: 'slide_plan'
      });

    if (columnError) {
      // If the function doesn't exist, try a different approach
      const { data: tableInfo, error: tableError } = await supabase
        .from('projects')
        .select('slide_plan')
        .limit(1);

      return NextResponse.json({
        hasSlidePlanColumn: !tableError,
        error: tableError?.message || null,
        needsMigration: !!tableError
      });
    }

    return NextResponse.json({
      hasSlidePlanColumn: columnCheck,
      needsMigration: !columnCheck
    });

  } catch (error) {
    console.error('Error checking schema:', error);
    return NextResponse.json({
      hasSlidePlanColumn: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      needsMigration: true
    }, { status: 500 });
  }
}
