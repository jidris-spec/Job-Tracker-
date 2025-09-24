// src/theme.js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0f5c59" },   // teal
    secondary: { main: "#0ea5e9" }, // cyan
    error: { main: "#ef4444" },
    warning: { main: "#f59e0b" },
    success: { main: "#22c55e" },
    info: { main: "#3b82f6" },
    background: {
      default: "transparent", // we'll set gradient via GlobalStyles
      paper: "rgba(255,255,255,0.9)", // glass panels
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      defaultProps: { variant: "contained" },
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 12,
          fontWeight: 600,
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        },
      },
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
