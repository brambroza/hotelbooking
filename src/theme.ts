import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2f8f6b" },
    secondary: { main: "#f2c45b" },
    text: { primary: "#1f2a2e" },
    background: { default: "#f4f6f8", paper: "#ffffff" },
  },
  typography: {
    fontFamily: "\"Kanit\", \"Segoe UI\", sans-serif",
    h1: { fontFamily: "\"Kanit\", \"Segoe UI\", sans-serif" },
    h2: { fontFamily: "\"Kanit\", \"Segoe UI\", sans-serif" },
    h3: { fontFamily: "\"Kanit\", \"Segoe UI\", sans-serif" },
    h4: { fontFamily: "\"Kanit\", \"Segoe UI\", sans-serif" },
    h5: { fontFamily: "\"Kanit\", \"Segoe UI\", sans-serif" },
    h6: { fontFamily: "\"Kanit\", \"Segoe UI\", sans-serif" },
  },
  shape: { borderRadius: 5 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", borderRadius: 5 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 5,
          boxShadow: "0 16px 32px rgba(24, 39, 75, 0.08)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999, fontWeight: 600 },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 5,
            backgroundColor: "#ffffff",
          },
        },
      },
    },
  },
});
