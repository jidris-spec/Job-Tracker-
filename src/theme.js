// src/theme.js
import { createTheme } from "@mui/material/styles";

export default function createAppTheme(mode = "light") {
  return createTheme({
    palette: {
      mode,
      primary: { main: "#0f5c59" }, // teal
      secondary: { main: "#0ea5e9" }, // cyan
      error: { main: "#ef4444" },
      warning: { main: "#f59e0b" },
      success: { main: "#22c55e" },
      info: { main: "#3b82f6" },
      background: {
        default: mode === "dark" ? "#0b1020" : "#f5f7fb",
        paper: mode === "dark" ? "#111827" : "#ffffff",
      },
      text: {
        primary: mode === "dark" ? "#e5e7eb" : "#111827",
        secondary: mode === "dark" ? "#9ca3af" : "#374151",
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
}
