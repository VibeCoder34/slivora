import { ThemeConfig } from './types';

export const neonTheme: ThemeConfig = {
  name: 'Neon Cyberpunk',
  fonts: { 
    primary: 'Orbitron', 
    secondary: 'Exo 2', 
    accent: 'Rajdhani' 
  },
  sizes: { 
    title: 52, 
    h2: 38, 
    bullet: 26, 
    caption: 18 
  },
  colors: {
    primary: '00FFFF',
    secondary: 'FF00FF',
    accent: '00FF00',
    background: '000000',
    text: 'FFFFFF',
    muted: '888888',
  },
  // Neon design characteristics
  design: {
    useShadows: true,
    useGradients: true,
    useDecorativeElements: true,
    borderRadius: 0,
    spacing: 'tight',
    visualWeight: 'bold'
  }
};
