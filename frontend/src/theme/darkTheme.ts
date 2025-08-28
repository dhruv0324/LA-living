import { createTheme } from '@mui/material/styles';

// Color palette for the dark finance theme
export const colors = {
  // Primary colors
  primary: {
    main: '#14B8A6', // Electric teal
    light: '#2DD4BF',
    dark: '#0F766E',
    contrastText: '#FFFFFF',
  },
  
  // Secondary colors
  secondary: {
    main: '#1F2937', // Slate gray
    light: '#374151',
    dark: '#111827',
    contrastText: '#F9FAFB',
  },
  
  // Background colors
  background: {
    default: '#111827', // Near-black
    paper: '#1F2937', // Slate gray for cards/modals
    elevated: '#374151', // Lighter gray for elevated elements
  },
  
  // Text colors
  text: {
    primary: '#F9FAFB', // White for primary text
    secondary: '#9CA3AF', // Soft gray for secondary text
    disabled: '#6B7280',
  },
  
  // Status colors
  success: {
    main: '#22C55E', // Neon green for income/gains
    light: '#4ADE80',
    dark: '#16A34A',
    contrastText: '#FFFFFF',
  },
  
  error: {
    main: '#F87171', // Red for expenses/losses
    light: '#FCA5A5',
    dark: '#DC2626',
    contrastText: '#FFFFFF',
  },
  
  warning: {
    main: '#FBBF24', // Amber for pending/warnings
    light: '#FCD34D',
    dark: '#D97706',
    contrastText: '#111827',
  },
  
  info: {
    main: '#14B8A6', // Electric teal
    light: '#2DD4BF',
    dark: '#0F766E',
    contrastText: '#FFFFFF',
  },
  
  // Custom colors for specific use cases
  custom: {
    income: '#22C55E',
    expense: '#F87171',
    pending: '#FBBF24',
    neutral: '#9CA3AF',
    border: '#374151',
    hover: '#4B5563',
    }
};

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    text: colors.text,
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
    divider: colors.custom.border,
  },
  
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
});

export default darkTheme; 