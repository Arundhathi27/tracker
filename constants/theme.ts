import { Colors } from './colors';

/**
 * BudgetWise Design System Theme
 * Centralizes all design tokens for consistent styling across the app.
 */

// ─── Spacing Scale (4px base) ─────────────────────────────────────────────
export const Spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────
export const Radius = {
  none: 0,
  sm: 4,
  DEFAULT: 8,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

// ─── Typography ───────────────────────────────────────────────────────────
export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
    mono: 'Courier',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 1.5,
  },
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────
export const Shadows = {
  none: {},
  sm: {
    shadowColor: Colors.primary[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  DEFAULT: {
    shadowColor: Colors.primary[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  md: {
    shadowColor: Colors.primary[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  lg: {
    shadowColor: Colors.primary[900],
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 32,
    elevation: 10,
  },
  xl: {
    shadowColor: Colors.primary[900],
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 16,
  },
  // Colored glow effects for cards
  primaryGlow: {
    shadowColor: Colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  successGlow: {
    shadowColor: Colors.success.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// ─── Animation Durations ──────────────────────────────────────────────────
export const Animation = {
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
  },
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
} as const;

// ─── Z-Index ──────────────────────────────────────────────────────────────
export const ZIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  raised: 10,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  popover: 500,
  toast: 600,
} as const;

// ─── Breakpoints (for responsive design) ─────────────────────────────────
export const Breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

// ─── Theme object (combined) ──────────────────────────────────────────────
export const Theme = {
  colors: Colors,
  spacing: Spacing,
  radius: Radius,
  typography: Typography,
  shadows: Shadows,
  animation: Animation,
  zIndex: ZIndex,
  breakpoints: Breakpoints,
} as const;

export type Theme = typeof Theme;
