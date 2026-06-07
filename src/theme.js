// src/theme.js
import { createTheme } from "@mui/material/styles";

export default function createAppTheme(mode = "dark") {
  const isDark = mode === "dark";
  return createTheme({
    palette: {
      mode,
      primary: { main: isDark ? "#3b82f6" : "#2563eb" },
      secondary: { main: "#22c55e" },
      error: { main: "#ef4444" },
      warning: { main: "#f59e0b" },
      success: { main: "#22c55e" },
      info: { main: "#3b82f6" },
      background: {
        default: isDark ? "#09090b" : "#f6f7f9",
        paper: isDark ? "#111114" : "#ffffff",
      },
      text: {
        primary: isDark ? "#fafafa" : "#0a0a0a",
        secondary: isDark ? "#8b8b93" : "#5f6470",
      },
      divider: isDark ? "#232329" : "#e6e8ec",
    },
    typography: {
      fontFamily:
        '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
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
            borderRadius: 10,
            fontWeight: 600,
            boxShadow: "none",
          },
        },
      },
      MuiCard: {
        styleOverrides: { root: { borderRadius: 16 } },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: "none",
            border: `1px solid ${isDark ? "#232329" : "#e6e8ec"}`,
          },
        },
      },
    },
  });
}
