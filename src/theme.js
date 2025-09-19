// src/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',               // change to 'dark' later if you want
    primary: { main: '#0f5c59' },// your teal
    secondary: { main: '#0ea5e9' },
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    success: { main: '#22c55e' },
    info: { main: '#3b82f6' },
  },
  shape: {
    borderRadius: 12,            // global rounded corners
  },
  components: {
    // Optional polish so it looks modern out of the box
    MuiButton: {
      defaultProps: { variant: 'contained' },
      styleOverrides: { root: { textTransform: 'none', borderRadius: 12 } },
    },
    MuiCard: {
      styleOverrides: { root: { borderRadius: 16 } },
    },
    MuiPaper: {
      styleOverrides: { root: { borderRadius: 16 } },
    },
  },
});

export default theme;
