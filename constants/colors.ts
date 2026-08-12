/**
 * BudgetWise Premium Luxury Financial App Color Palette
 *
 * Warm Cream Theme with Coffee Brown primary elements.
 */

export const Colors = {
  // ─── Primary (Coffee Brown) ──────────────────────────────────────────────
  primary: {
    DEFAULT: '#6B4F3A',
    50: '#F5F1EE',
    100: '#EAE1DA',
    200: '#D5C3B5',
    300: '#BFA591',
    400: '#AA886C',
    500: '#6B4F3A',
    600: '#5A4231',
    700: '#483527',
    800: '#36281D',
    900: '#241A13',
    950: '#120D0A',
  },

  // ─── Secondary (Soft Beige) ──────────────────────────────────────────────
  secondary: {
    DEFAULT: '#D8C3A5',
    50: '#FDFCFB',
    100: '#F9F5F0',
    200: '#F0E5D7',
    300: '#E7D5BE',
    400: '#DEC4A4',
    500: '#D8C3A5',
    600: '#BAA27D',
    700: '#9C8155',
    800: '#7E602D',
    900: '#604105',
  },

  // ─── Accent (Muted Gold) ─────────────────────────────────────────────────
  accent: {
    DEFAULT: '#C9A86A',
    50: '#FBF9F5',
    100: '#F6EFEB',
    200: '#EDDFD7',
    300: '#E4CEC3',
    400: '#DABDAF',
    500: '#C9A86A',
    600: '#AA854B',
    700: '#8B622C',
    800: '#6D400D',
    900: '#4E1D00',
  },

  // ─── Success ─────────────────────────────────────────────────────────────
  success: {
    DEFAULT: '#4F8A5B',
    50: '#EEF6F0',
    100: '#DDECDA',
    200: '#BBD8B5',
    300: '#98C391',
    400: '#76AF6C',
    500: '#4F8A5B',
    600: '#3D6C46',
    700: '#2A4D31',
    800: '#182E1C',
    900: '#060F07',
  },

  // ─── Warning ─────────────────────────────────────────────────────────────
  warning: {
    DEFAULT: '#D4A373',
    50: '#FDF9F5',
    100: '#FAF3EB',
    200: '#F4E7D7',
    300: '#EEDBC3',
    400: '#E8CFAF',
    500: '#D4A373',
    600: '#B6824D',
    700: '#986127',
    800: '#7A4001',
    900: '#5C1F00',
  },

  // ─── Danger ──────────────────────────────────────────────────────────────
  danger: {
    DEFAULT: '#C65A5A',
    50: '#FCF3F3',
    100: '#FAE8E8',
    200: '#F4D1D1',
    300: '#EEB9B9',
    400: '#E8A2A2',
    500: '#C65A5A',
    600: '#AA4141',
    700: '#8E2828',
    800: '#720F0F',
    900: '#560000',
  },

  // ─── Background (Warm Cream) ─────────────────────────────────────────────
  background: {
    DEFAULT: '#F8F5EF',
    secondary: '#F0ECE3',
    tertiary: '#E8E3D7',
  },

  // ─── Surface (Cards) ─────────────────────────────────────────────────────
  surface: {
    DEFAULT: '#FFFDF8',
    elevated: '#FFFFFF',
    hover: '#F4EFE6',
  },

  // ─── Border ──────────────────────────────────────────────────────────────
  border: {
    DEFAULT: '#E7DFD3',
    muted: '#F2ECE2',
    focus: '#6B4F3A',
  },

  // ─── Text ────────────────────────────────────────────────────────────────
  text: {
    primary: '#2E2E2E',
    secondary: '#6D6D6D',
    tertiary: '#A3A3A3',
    disabled: '#C2C2C2',
    inverse: '#FFFDF8',
  },

  // ─── Gradient Stops ──────────────────────────────────────────────────────
  gradients: {
    primary: ['#6B4F3A', '#483527'] as const,
    secondary: ['#D8C3A5', '#BAA27D'] as const,
    income: ['#4F8A5B', '#2A4D31'] as const,
    expense: ['#C65A5A', '#8E2828'] as const,
    card: ['#FFFDF8', '#F8F5EF'] as const,
    hero: ['#FFFDF8', '#F8F5EF'] as const,
  },

  // ─── Semantic Aliases ────────────────────────────────────────────────────
  income: '#4F8A5B',
  expense: '#C65A5A',
  saving: '#C9A86A',
  investment: '#6B4F3A',

  // ─── Neutrals ────────────────────────────────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
