import { createTheme } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';

export function createAppTheme(mode: PaletteMode) {
  return createTheme({
    breakpoints: {
      values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
    },
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            primary: { main: '#1976d2' },
            secondary: { main: '#dc004e' },
            background: { default: '#f5f5f5', paper: '#ffffff' },
          }
        : {
            primary: { main: '#90caf9' },
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
