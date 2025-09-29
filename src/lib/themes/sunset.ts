import { ThemeConfig } from './types';

export const sunsetTheme: ThemeConfig = {
  name: 'Sunset Vibes',
  fonts: { 
    primary: 'Montserrat', 
    secondary: 'Open Sans', 
    accent: 'Dancing Script' 
  },
  sizes: { 
    title: 46, 
    h2: 32, 
    bullet: 22, 
    caption: 16 
  },
  colors: {
    primary: 'FF6B35',
    secondary: 'F7931E',
    accent: 'FFD23F',
    background: 'FFF8E1',
    text: '2C3E50',
    muted: '7F8C8D',
  },
  // Sunset design characteristics
  design: {
    useShadows: true,
    useGradients: true,
    useDecorativeElements: true,
    borderRadius: 10,
    spacing: 'comfortable',
    visualWeight: 'medium'
  }
};
