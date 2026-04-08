import { createTheme } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';

const DEFAULT_PRIMARY = '#1976d2';

/**
 * Lighten a hex color for dark mode variant.
 * Simple approach: blend with white at 60%.
 */
function lightenHex(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const blend = (c: number) => Math.round(c + (255 - c) * 0.6);
  return `#${blend(r).toString(16).padStart(2, '0')}${blend(g).toString(16).padStart(2, '0')}${blend(b).toString(16).padStart(2, '0')}`;
}

export function createAppTheme(mode: PaletteMode, primaryColor?: string | null) {
  const primary = primaryColor || DEFAULT_PRIMARY;
  const darkPrimary = lightenHex(primary);

  return createTheme({
    breakpoints: {
      values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
    },
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            primary: { main: primary },
            secondary: { main: '#dc004e' },
            background: { default: '#f5f5f5', paper: '#ffffff' },
          }
        : {
            primary: { main: darkPrimary },
            secondary: { main: '#f48fb1' },
            background: { default: '#121212', paper: '#1e1e1e' },
          }),
    },
    typography: {
      fontFamily: '"Pretendard", "Roboto", "Helvetica", "Arial", sans-serif',
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
    components: {
      MuiButton: {
        defaultProps: { size: 'small' },
        styleOverrides: { root: { textTransform: 'none' } },
      },
      MuiTextField: {
        defaultProps: { size: 'small' },
      },
      MuiCard: {
        styleOverrides: { root: { borderRadius: 8 } },
      },
    },
  });
}

// Default export for backward compatibility
const theme = createAppTheme('light');
export default theme;
