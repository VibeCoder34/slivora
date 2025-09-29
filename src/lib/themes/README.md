# Theme System

This directory contains all presentation theme configurations, separated into individual files for better maintainability and organization.

## 📁 File Structure

```
src/lib/themes/
├── index.ts          # Main exports and theme registry
├── types.ts          # TypeScript type definitions
├── minimal.ts        # Minimal theme configuration
├── modern.ts         # Modern theme configuration
├── corporate.ts      # Corporate theme configuration
├── colorful.ts       # Colorful theme configuration
├── creative.ts       # Creative theme configuration
├── cosmic.ts         # Cosmic Dreams theme configuration
├── neon.ts           # Neon Cyberpunk theme configuration
├── sunset.ts         # Sunset Vibes theme configuration
└── README.md         # This documentation
```

## 🎨 Available Themes

### Free Plan Themes
- **Minimal**: Clean, simple design with black and white colors
- **Modern**: Contemporary blue theme with professional styling

### Paid Plan Themes
- **Corporate**: Professional business style with Arial fonts
- **Colorful**: Vibrant, energetic colors for engaging presentations
- **Creative**: Artistic purple gradient theme for creative presentations
- **Cosmic Dreams**: Space-inspired design with dark backgrounds
- **Neon Cyberpunk**: Cyberpunk neon style with bright colors
- **Sunset Vibes**: Warm sunset colors with elegant fonts

## 🔧 Theme Configuration

Each theme file exports a `ThemeConfig` object with the following structure:

```typescript
interface ThemeConfig {
  name: string;                    // Display name
  fonts: {                        // Font families
    primary: string;
    secondary: string;
    accent: string;
  };
  sizes: {                        // Font sizes in points
    title: number;
    h2: number;
    bullet: number;
    caption: number;
  };
  colors: {                       // Hex colors (without #)
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
  };
  design: {                       // Design characteristics
    useShadows: boolean;
    useGradients: boolean;
    useDecorativeElements: boolean;
    borderRadius: number;
    spacing: 'tight' | 'standard' | 'comfortable' | 'generous';
    visualWeight: 'light' | 'medium' | 'heavy' | 'bold';
  };
}
```

## 🚀 Usage

### Import a specific theme
```typescript
import { minimalTheme } from '@/lib/themes/minimal';
```

### Import all themes
```typescript
import { THEMES } from '@/lib/themes';
```

### Get theme by key
```typescript
import { getTheme } from '@/lib/themes';
const theme = getTheme('modern');
```

### Check theme availability
```typescript
import { isThemeAvailableForPlan } from '@/lib/themes';
const isAvailable = isThemeAvailableForPlan('creative', 'free');
```

## 🎯 Adding New Themes

1. Create a new theme file (e.g., `my-theme.ts`)
2. Export a `ThemeConfig` object
3. Add the theme to the `THEMES` registry in `index.ts`
4. Update the `ThemeKey` type in `types.ts`
5. Add the theme to the pricing configuration

## 🎨 Customizing Themes

To modify an existing theme:

1. Open the theme file (e.g., `modern.ts`)
2. Update the colors, fonts, sizes, or design properties
3. The changes will automatically apply to all presentations using that theme

## 🔒 Theme Restrictions

Themes are restricted based on subscription plans:
- **Free**: Minimal, Modern
- **Paid Plans**: All themes available

This is configured in `src/lib/config/pricing.ts`.
