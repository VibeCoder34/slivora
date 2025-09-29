import { ThemeConfig } from './types';

export const cosmicTheme: ThemeConfig = {
  name: 'Cosmic Dreams',
  fonts: { 
    primary: 'Impact', 
    secondary: 'Arial Black', 
    accent: 'Comic Sans MS' 
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
    background: '1A1A2E',
    text: 'FFFFFF',
    muted: 'B0B0B0',
  },
  // Cosmic design characteristics
  design: {
    useShadows: true,
    useGradients: true,
    useDecorativeElements: true,
    borderRadius: 20,
    spacing: 'generous',
    visualWeight: 'bold'
  }
};
