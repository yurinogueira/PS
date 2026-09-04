import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    brand: {
      primary: string;
      secondary: string;
      tertiary: string;
      quaternary: string;
      quinary: string;
      gradient: string;
    };
  }
  interface PaletteOptions {
    brand?: {
      primary: string;
      secondary: string;
      tertiary: string;
      quaternary: string;
      quinary: string;
      gradient: string;
    };
  }
}

export const brandColors = {
  primary: "#392782",
  secondary: "#303A82",
  tertiary: "#756682",
  quaternary: "#536882",
  quinary: "#794582",
  gradient: "linear-gradient(135deg, #392782 0%, #794582 100%)",
};

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: brandColors.primary,
      light: brandColors.tertiary,
      dark: brandColors.secondary,
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: brandColors.secondary,
      light: brandColors.quaternary,
      dark: brandColors.primary,
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#F8FAFC",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1A1A1A",
      secondary: brandColors.quaternary,
    },
    divider: "#E2E8F0",
    brand: brandColors,
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: ["Inter", "system-ui", "-apple-system", "sans-serif"].join(","),
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
    h4: {
      fontWeight: 700,
      color: brandColors.primary,
    },
    h5: {
      fontWeight: 600,
      color: brandColors.primary,
    },
    h6: {
      fontWeight: 600,
      color: brandColors.primary,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(57, 39, 130, 0.25)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: "1px solid #E2E8F0",
          boxShadow: "0 4px 20px -2px rgba(57, 39, 130, 0.06)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 16,
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        asterisk: {
          color: "#d32f2f",
          fontWeight: 700,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#F8FAFC",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: "#0F172A",
        },
      },
    },
    MuiTablePagination: {
      defaultProps: {
        rowsPerPageOptions: [10, 25, 50],
      },
      styleOverrides: {
        root: {
          borderTop: "1px solid #E2E8F0",
        },
        toolbar: {
          flexWrap: "wrap",
          paddingTop: 8,
          paddingBottom: 8,
        },
      },
    },
  },
});
