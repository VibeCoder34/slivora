import { ThemeConfig } from './types';

export const colorfulTheme: ThemeConfig = {
  name: 'Colorful',
  fonts: { 
    primary: 'Inter', 
    secondary: 'Inter', 
    accent: 'Inter' 
  },
  sizes: { 
    title: 48, 
    h2: 36, 
    bullet: 24, 
    caption: 16 
  },
  colors: {
    primary: 'FF6B6B',
    secondary: '4ECDC4',
    accent: '45B7D1',
    background: 'FFFFFF',
    text: '2C3E50',
    muted: '7F8C8D',
  },
  // Colorful design characteristics
  design: {
    useShadows: true,
    useGradients: true,
    useDecorativeElements: true,
    borderRadius: 12,
    spacing: 'generous',
    visualWeight: 'medium'
  }
};
