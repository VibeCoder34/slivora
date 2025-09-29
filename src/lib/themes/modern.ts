import { ThemeConfig } from './types';

export const modernTheme: ThemeConfig = {
  name: 'Modern',
  fonts: { 
    primary: 'Inter', 
    secondary: 'Inter', 
    accent: 'Inter' 
  },
  sizes: { 
    title: 46, 
    h2: 34, 
    bullet: 22, 
    caption: 16 
  },
  colors: {
    primary: '2563EB',
    secondary: '1E40AF',
    accent: '3B82F6',
    background: 'FFFFFF',
    text: '1F2937',
    muted: '6B7280',
  },
  // Modern design characteristics
  design: {
    useShadows: true,
    useGradients: true,
    useDecorativeElements: true,
    borderRadius: 8,
    spacing: 'comfortable',
    visualWeight: 'medium'
  }
};
