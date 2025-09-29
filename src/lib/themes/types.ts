export interface ThemeConfig {
  name: string;
  fonts: {
    primary: string;
    secondary: string;
    accent: string;
  };
  sizes: {
    title: number;
    h2: number;
    bullet: number;
    caption: number;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
  };
  design: {
    useShadows: boolean;
    useGradients: boolean;
    useDecorativeElements: boolean;
    borderRadius: number;
    spacing: 'tight' | 'standard' | 'comfortable' | 'generous';
    visualWeight: 'light' | 'medium' | 'heavy' | 'bold';
  };
}

export type ThemeKey = 
  | 'minimal' 
  | 'modern' 
  | 'corporate' 
  | 'colorful' 
  | 'creative' 
  | 'cosmic' 
  | 'neon' 
  | 'sunset';
