import { ThemeConfig, ThemeKey } from './types';
import { minimalTheme } from './minimal';
import { modernTheme } from './modern';
import { corporateTheme } from './corporate';
import { colorfulTheme } from './colorful';
import { creativeTheme } from './creative';
import { cosmicTheme } from './cosmic';
import { neonTheme } from './neon';
import { sunsetTheme } from './sunset';
import { getAvailableThemesForPlan } from '../config/pricing';

export const THEMES: Record<ThemeKey, ThemeConfig> = {
  minimal: minimalTheme,
  modern: modernTheme,
  corporate: corporateTheme,
  colorful: colorfulTheme,
  creative: creativeTheme,
  cosmic: cosmicTheme,
  neon: neonTheme,
  sunset: sunsetTheme,
};

export function getTheme(themeKey: string): ThemeConfig {
  const key = themeKey as ThemeKey;
  return THEMES[key] || THEMES.minimal; // fallback to minimal
}

export function getRandomTheme(): ThemeConfig {
  const keys = Object.keys(THEMES) as ThemeKey[];
  return THEMES[keys[Math.floor(Math.random() * keys.length)]];
}

export function isThemeAvailableForPlan(themeKey: string, planId: string): boolean {
  // This will be imported from the pricing config
  const availableThemes = getAvailableThemesForPlan(planId);
  return availableThemes.includes(themeKey);
}

// Re-export all themes for individual use
export {
  minimalTheme,
  modernTheme,
  corporateTheme,
  colorfulTheme,
  creativeTheme,
  cosmicTheme,
  neonTheme,
  sunsetTheme,
};

export type { ThemeConfig, ThemeKey };
