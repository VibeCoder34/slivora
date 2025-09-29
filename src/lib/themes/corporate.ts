import { ThemeConfig } from './types';

export const corporateTheme: ThemeConfig = {
  name: 'Corporate',
  fonts: { 
    primary: 'Arial', 
    secondary: 'Arial', 
    accent: 'Arial' 
  },
  sizes: { 
    title: 42, 
    h2: 30, 
    bullet: 20, 
    caption: 14 
  },
  colors: {
    primary: '1F2937',
    secondary: '374151',
    accent: '4B5563',
    background: 'FFFFFF',
    text: '1F2937',
    muted: '6B7280',
  },
  // Corporate design characteristics
  design: {
    useShadows: false,
    useGradients: false,
    useDecorativeElements: false,
    borderRadius: 0,
    spacing: 'standard',
    visualWeight: 'heavy'
  }
};
