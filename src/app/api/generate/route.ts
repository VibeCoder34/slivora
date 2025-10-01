import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { buildPptxBuffer } from '@/lib/pptx';
import { SlidePlan } from '@/types/slide-plan';

export async function GET(request: NextRequest) {
  try {
    // Read the logo file and convert to base64 data URL
    const logoPath = path.join(process.cwd(), 'public', 'slivoralogonoback.png');
    console.log('Logo path:', logoPath);
    
    const logoBuffer = fs.readFileSync(logoPath);
    console.log('Logo buffer size:', logoBuffer.length);
    
    const logoBase64 = logoBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${logoBase64}`;
    console.log('Data URL length:', dataUrl.length);

    // Create a dummy slide plan for testing
    const dummyPlan: SlidePlan = {
      projectTitle: 'Slivora Watermark Test Presentation',
      language: 'English',
      slides: [
        {
          id: 'slide-1',
          title: 'Welcome to Slivora',
          bullets: [
            'AI-powered presentation generation',
            'Beautiful themes and layouts',
            'Professional watermark integration',
            'Easy to use and customize'
          ],
          layout: 'title-bullets',
          speakerNotes: 'This is a test presentation to demonstrate the watermark functionality.'
        },
        {
          id: 'slide-2',
          title: 'Key Features',
          bullets: [
            'Multiple slide layouts available',
            'Custom themes and color schemes',
            'Automatic watermark placement',
            'Export to PowerPoint format'
          ],
          layout: 'title-bullets',
          speakerNotes: 'Highlight the main features of our presentation generator.'
        },
        {
          id: 'slide-3',
          title: 'Thank You!',
          layout: 'title',
          speakerNotes: 'Closing slide with watermark demonstration.'
        }
      ],
      references: [
        {
          label: 'Slivora Official Website',
          url: 'https://slivora.com'
        }
      ]
    };

    // Generate the PPTX buffer with watermark
    const pptxBuffer = await buildPptxBuffer(
      dummyPlan,
      'minimal',
      'free',
      { watermarkLogoDataUrl: dataUrl }
    );

    // Return the PPTX file as a downloadable response
    return new NextResponse(pptxBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': 'attachment; filename="slivora-test.pptx"',
        'Content-Length': pptxBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating PPTX:', error);
    return NextResponse.json(
      { error: 'Failed to generate PPTX file' },
      { status: 500 }
    );
  }
}