import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  breakpoints: {
    values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
  },
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#f5f5f5' },
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

export default theme;
