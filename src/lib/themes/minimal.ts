import { ThemeConfig } from './types';

export const minimalTheme: ThemeConfig = {
  name: 'Minimal',
  fonts: { 
    primary: 'Inter', 
    secondary: 'Inter', 
    accent: 'Inter' 
  },
  sizes: { 
    title: 44, 
    h2: 32, 
    bullet: 20, 
    caption: 14 
  },
  colors: {
    primary: '000000',
    secondary: '333333',
    accent: '666666',
    background: 'FFFFFF',
    text: '000000',
    muted: '666666',
  },
  // Minimal design characteristics
  design: {
    useShadows: false,
    useGradients: false,
    useDecorativeElements: false,
    borderRadius: 0,
    spacing: 'tight',
    visualWeight: 'light'
  }
};
