import PptxGenJS from 'pptxgenjs';
import { SlidePlan, Slide } from '../types/slide-plan';

// ===============================
// Eccentric theme configurations
// ===============================
const THEMES = {
  cosmic: {
    name: 'Cosmic Dreams',
    fonts: { primary: 'Impact', secondary: 'Arial Black', accent: 'Comic Sans MS' },
    sizes: { title: 48, h2: 36, bullet: 24, caption: 16 },
    colors: {
      primary: 'FF6B6B',
      secondary: '4ECDC4',
      accent: '45B7D1',
      background: '1A1A2E',
      text: 'FFFFFF',
      muted: 'B0B0B0',
    },
  },
  neon: {
    name: 'Neon Cyberpunk',
    fonts: { primary: 'Orbitron', secondary: 'Exo 2', accent: 'Rajdhani' },
    sizes: { title: 52, h2: 38, bullet: 26, caption: 18 },
    colors: {
      primary: '00FFFF',
      secondary: 'FF00FF',
      accent: '00FF00',
      background: '000000',
      text: 'FFFFFF',
      muted: '888888',
    },
  },
  sunset: {
    name: 'Sunset Vibes',
    fonts: { primary: 'Montserrat', secondary: 'Open Sans', accent: 'Dancing Script' },
    sizes: { title: 46, h2: 32, bullet: 22, caption: 16 },
    colors: {
      primary: 'FF6B35',
      secondary: 'F7931E',
      accent: 'FFD23F',
      background: 'FFF8E1',
      text: '2C3E50',
      muted: '7F8C8D',
    },
  },
} as const;

// ===============
// Theme helpers
// ===============
function getRandomTheme() {
  const keys = Object.keys(THEMES) as (keyof typeof THEMES)[];
  return THEMES[keys[Math.floor(Math.random() * keys.length)]];
}

// NOTE: make it reassignable (we change the reference; we DO NOT mutate)
let CURRENT_THEME = getRandomTheme();

// ===============
// Util helpers
// ===============
function ensureLen(str: string, max: number): string {
  if (!str) return '';
  return str.length <= max ? str : str.substring(0, max - 3) + '...';
}

function createSlug(title: string): string {
  return (title || 'presentation')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// A consistent safe content grid to prevent collisions
const SAFE = { x: 0.8, right: 9.2, top: 0.7, bottom: 5.2 };
const CONTENT_W = SAFE.right - SAFE.x; // 8.4"
const LINE_H = 0.6; // default logical line height for layout scaffolding

// =====================
// Text helper functions
// =====================
function addTitle(slideObj: PptxGenJS.Slide, text: string, opts?: { y?: number; h?: number }) {
  const t = CURRENT_THEME;
  const y = opts?.y ?? 0.9;
  const h = opts?.h ?? 1.4;

  slideObj.addText(ensureLen(text, 100), {
    x: SAFE.x,
    y,
    w: CONTENT_W,
    h,
    fontSize: t.sizes.title,
    fontFace: t.fonts.primary,
    color: t.colors.text,
    align: 'center',
    valign: 'middle',
    bold: true,
    fit: 'shrink', // shrink text to avoid overflow
    lineSpacingMultiple: 1.1,
    margin: 6,
    shadow: { type: 'outer', color: '000000', blur: 10, offset: 2 },
  });
}

function addSubtitle(slideObj: PptxGenJS.Slide, text: string, opts?: { y?: number; h?: number }) {
  const t = CURRENT_THEME;
  const y = opts?.y ?? 2.2;
  const h = opts?.h ?? 0.9;

  if (!text) return;

  slideObj.addText(ensureLen(text, 160), {
    x: SAFE.x,
    y,
    w: CONTENT_W,
    h,
    fontSize: t.sizes.caption,
    fontFace: t.fonts.accent,
    color: t.colors.muted,
    align: 'center',
    valign: 'middle',
    italic: true,
    fit: 'shrink',
    lineSpacingMultiple: 1.1,
    margin: 6,
  });
}

function addBullets(slideObj: PptxGenJS.Slide, bullets: string[], yStart: number, maxHeight: number) {
  const t = CURRENT_THEME;
  if (!bullets?.length) return;

  // Single text box with paragraph bullets prevents overlaps
  const paragraphs = bullets.slice(0, 12).map((b) => ({
    text: ensureLen(b || '', 300),
    options: {
      bullet: true,
      fontFace: t.fonts.secondary,
      fontSize: t.sizes.bullet,
      color: t.colors.text,
      breakLine: true,
      paraSpaceAfter: 8, // space between bullets
      lineSpacingMultiple: 1.15,
    },
  }));

  slideObj.addText(paragraphs as any, {
    x: SAFE.x,
    y: yStart,
    w: CONTENT_W,
    h: maxHeight,
    isTextBox: true,
    wrap: true,
    margin: 8,
    fit: 'shrink', // text shrinks if it would overflow height
  });
}

// =====================
// Slide design builders
// =====================

// ---- Title ----
function createTitleSlide(pptx: PptxGenJS, slide: Slide): void {
  const s = pptx.addSlide();
  const t = CURRENT_THEME;

  s.background = { color: t.colors.background };

  // Decorative shapes behind text
  s.addShape('rect', { x: 0.5, y: 0.5, w: 1.5, h: 1.5, fill: { color: t.colors.primary, transparency: 20 }, rotate: 45 });
  s.addShape('ellipse', { x: 8, y: 1, w: 1, h: 1, fill: { color: t.colors.secondary, transparency: 30 } });
  s.addShape('triangle', { x: 7, y: 4, w: 1.5, h: 1.5, fill: { color: t.colors.accent, transparency: 25 } });

  addTitle(s, slide.title, { y: 1.7, h: 1.8 });

  // Accent line
  s.addShape('rect', { x: 2, y: 4.2, w: 6, h: 0.12, fill: { color: t.colors.accent } });

  // Tiny sparkles
  s.addShape('rect', { x: 1.5, y: 4.6, w: 0.28, h: 0.28, fill: { color: t.colors.accent }, rotate: 45 });
  s.addShape('rect', { x: 8.2, y: 4.6, w: 0.28, h: 0.28, fill: { color: t.colors.primary }, rotate: 45 });
}

// ---- Title + Bullets ----
function createTitleBulletsSlide(pptx: PptxGenJS, slide: Slide): void {
  const s = pptx.addSlide();
  const t = CURRENT_THEME;

  s.background = { color: t.colors.background };

  // Corner accents
  s.addShape('rect', { x: 0, y: 0, w: 2, h: 0.25, fill: { color: t.colors.primary }, rotate: 15 });
  s.addShape('rect', { x: 8, y: 0, w: 2, h: 0.25, fill: { color: t.colors.secondary }, rotate: -15 });

  // Title
  s.addText(ensureLen(slide.title, 100), {
    x: SAFE.x,
    y: 0.75,
    w: CONTENT_W,
    h: 0.9,
    fontSize: t.sizes.h2,
    fontFace: t.fonts.primary,
    color: t.colors.text,
    align: 'center',
    bold: true,
    fit: 'shrink',
    lineSpacingMultiple: 1.1,
    margin: 4,
    shadow: { type: 'outer', color: '000000', blur: 6, offset: 1 },
  });

  // Underline
  s.addShape('rect', { x: 2, y: 1.8, w: 6, h: 0.08, fill: { color: t.colors.accent } });

  // Bullets: single text box inside a tall area prevents any overlap
  const bulletsStartY = 2.05;
  const bulletsHeight = SAFE.bottom - bulletsStartY - 0.2;
  addBullets(s, slide.bullets ?? [], bulletsStartY, bulletsHeight);

  // Floating accents
  s.addShape('rect', { x: 8.5, y: 4.5, w: 0.35, h: 0.35, fill: { color: t.colors.accent, transparency: 40 }, rotate: 45 });
  s.addShape('triangle', { x: 0.55, y: 4.75, w: 0.28, h: 0.28, fill: { color: t.colors.primary, transparency: 50 }, rotate: 30 });
}

// ---- Section Divider ----
function createSectionSlide(pptx: PptxGenJS, slide: Slide): void {
  const s = pptx.addSlide();
  const t = CURRENT_THEME;

  s.background = { color: t.colors.background };

  // Large faded ellipses behind
  s.addShape('ellipse', { x: -1, y: -1, w: 3, h: 3, fill: { color: t.colors.primary, transparency: 15 } });
  s.addShape('ellipse', { x: 8, y: 3.5, w: 3, h: 3, fill: { color: t.colors.secondary, transparency: 15 } });

  // Diagonal bars
  s.addShape('rect', { x: 0, y: 1.1, w: 10, h: 0.18, fill: { color: t.colors.accent }, rotate: -5 });
  s.addShape('rect', { x: 0, y: 4.5, w: 10, h: 0.18, fill: { color: t.colors.primary }, rotate: 5 });

  addTitle(s, slide.title, { y: 1.75, h: 1.6 });

  // Optional subtitle from speaker notes (non-overlapping)
  addSubtitle(s, slide.speakerNotes ?? '', { y: 3.7, h: 0.7 });

  // Corner accents
  s.addShape('rect', { x: 0.5, y: 0.5, w: 0.45, h: 0.45, fill: { color: t.colors.accent }, rotate: 45 });
  s.addShape('rect', { x: 9, y: 5, w: 0.45, h: 0.45, fill: { color: t.colors.primary }, rotate: 45 });
}

// ---- Quote ----
function createQuoteSlide(pptx: PptxGenJS, slide: Slide): void {
  const s = pptx.addSlide();
  const t = CURRENT_THEME;

  s.background = { color: t.colors.background };

  // Soft dots
  s.addShape('ellipse', { x: 1, y: 0.5, w: 0.8, h: 0.8, fill: { color: t.colors.primary, transparency: 20 } });
  s.addShape('ellipse', { x: 8.2, y: 4.5, w: 0.8, h: 0.8, fill: { color: t.colors.secondary, transparency: 20 } });

  // Frame
  s.addShape('rect', {
    x: 0.8,
    y: 1.2,
    w: 8.4,
    h: 3.2,
    fill: { color: t.colors.background, transparency: 10 },
    line: { type: 'solid', color: t.colors.accent, pt: 3, dashType: 'dash' },
  });
  s.addShape('rect', {
    x: 1.2,
    y: 1.6,
    w: 7.6,
    h: 2.4,
    fill: { color: 'transparent' },
    line: { type: 'solid', color: t.colors.primary, pt: 1, dashType: 'dash' },
  });

  // Quote text (single box, shrinks if needed)
  s.addText(ensureLen(slide.title, 240), {
    x: 1.5,
    y: 2.0,
    w: 7,
    h: 1.6,
    fontSize: CURRENT_THEME.sizes.h2,
    fontFace: CURRENT_THEME.fonts.accent,
    color: CURRENT_THEME.colors.text,
    align: 'center',
    valign: 'middle',
    italic: true,
    lineSpacingMultiple: 1.2,
    fit: 'shrink',
    shadow: { type: 'outer', color: '000000', blur: 6, offset: 1 },
    margin: 8,
  });

  // Attribution
  if (slide.speakerNotes) {
    s.addText(ensureLen(slide.speakerNotes, 120), {
      x: 2,
      y: 4.8,
      w: 6,
      h: 0.35,
      fontSize: CURRENT_THEME.sizes.caption,
      fontFace: CURRENT_THEME.fonts.secondary,
      color: CURRENT_THEME.colors.muted,
      align: 'center',
      valign: 'middle',
      bold: true,
      fit: 'shrink',
    });
  }

  // Accents
  s.addShape('rect', { x: 0.5, y: 1.5, w: 0.28, h: 0.28, fill: { color: t.colors.accent }, rotate: 45 });
  s.addShape('rect', { x: 9.2, y: 4.2, w: 0.28, h: 0.28, fill: { color: t.colors.primary }, rotate: 45 });
  s.addShape('rect', { x: 2, y: 5.05, w: 6, h: 0.12, fill: { color: t.colors.accent } });
}

// ---- Image-focused (title + decorative frame; image insertion left to caller) ----
function createImageSlide(pptx: PptxGenJS, slide: Slide): void {
  const s = pptx.addSlide();
  const t = CURRENT_THEME;

  s.background = { color: t.colors.background };

  // Decorative frame
  s.addShape('rect', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 4.5,
    fill: { color: 'transparent' },
    line: { type: 'solid', color: t.colors.accent, pt: 4, dashType: 'dash' },
  });

  // Title
  s.addText(ensureLen(slide.title, 80), {
    x: 1,
    y: 1,
    w: 8,
    h: 0.9,
    fontSize: t.sizes.h2,
    fontFace: t.fonts.primary,
    color: t.colors.text,
    align: 'center',
    valign: 'middle',
    bold: true,
    fit: 'shrink',
    shadow: { type: 'outer', color: '000000', blur: 8, offset: 2 },
  });

  // Accents
  s.addShape('ellipse', { x: 8.5, y: 0.2, w: 0.5, h: 0.5, fill: { color: t.colors.primary } });
  s.addShape('triangle', { x: 0.2, y: 4.8, w: 0.4, h: 0.4, fill: { color: t.colors.secondary }, rotate: 45 });

  // If you want to actually place an image from slide data:
  // if (slide.imagePath) {
  //   s.addImage({ path: slide.imagePath, x: 1.2, y: 1.9, w: 7.6, h: 3.0 });
  // }
}

// =====================
// Layout router
// =====================
function createSlide(pptx: PptxGenJS, slide: Slide): void {
  const layout = (slide.layout || 'title-bullets') as Slide['layout'];

  switch (layout) {
    case 'title':
      createTitleSlide(pptx, slide);
      break;
    case 'title-bullets':
      createTitleBulletsSlide(pptx, slide);
      break;
    case 'section':
      createSectionSlide(pptx, slide);
      break;
    case 'quote':
      createQuoteSlide(pptx, slide);
      break;
    case 'image':
      createImageSlide(pptx, slide);
      break;
    default:
      createTitleBulletsSlide(pptx, slide);
  }
}

// =====================
// Public API
// =====================
export async function buildPptxBuffer(plan: SlidePlan): Promise<Buffer> {
  const pptx = new PptxGenJS();

  // Deck layout & meta
  pptx.defineLayout({ name: '16x9', width: 10, height: 5.625 });
  pptx.layout = '16x9';
  pptx.author = 'AI Presentation Generator - Eccentric Edition';
  pptx.company = 'SlideSmith Creative Studio';
  pptx.subject = plan.projectTitle;
  pptx.title = plan.projectTitle;
  pptx.revision = '1';

  // Slides
  for (let i = 0; i < plan.slides.length; i++) {
    // Optional variety every 3 slides (non-mutating: replace reference)
    if (i > 0 && i % 3 === 0) {
      CURRENT_THEME = getRandomTheme();
    }
    createSlide(pptx, plan.slides[i]);
  }

  // Closing slide
  const s = pptx.addSlide();
  s.background = { color: CURRENT_THEME.colors.background };
  s.addText('Thank You!', {
    x: 1,
    y: 2,
    w: 8,
    h: 1.5,
    fontSize: CURRENT_THEME.sizes.title,
    fontFace: CURRENT_THEME.fonts.primary,
    color: CURRENT_THEME.colors.text,
    align: 'center',
    valign: 'middle',
    bold: true,
    fit: 'shrink',
    shadow: { type: 'outer', color: '000000', blur: 15, offset: 3 },
  });
  s.addShape('rect', { x: 4.5, y: 3.5, w: 1, h: 1, fill: { color: CURRENT_THEME.colors.accent }, rotate: 45 });

  const buffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
  return buffer;
}

export function generateFilename(plan: SlidePlan): string {
  const slug = createSlug(plan.projectTitle);
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `${slug}-${timestamp}.pptx`;
}
