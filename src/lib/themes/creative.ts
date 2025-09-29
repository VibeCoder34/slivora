import { ThemeConfig } from './types';

export const creativeTheme: ThemeConfig = {
  name: 'Creative',
  fonts: { 
    primary: 'Inter', 
    secondary: 'Inter', 
    accent: 'Inter' 
  },
  sizes: { 
    title: 50, 
    h2: 38, 
    bullet: 26, 
    caption: 18 
  },
  colors: {
    primary: '8B5CF6',
    secondary: 'A855F7',
    accent: 'C084FC',
    background: 'FFFFFF',
    text: '1F2937',
    muted: '6B7280',
  },
  // Creative design characteristics
  design: {
    useShadows: true,
    useGradients: true,
    useDecorativeElements: true,
    borderRadius: 16,
    spacing: 'generous',
    visualWeight: 'bold'
  }
};
