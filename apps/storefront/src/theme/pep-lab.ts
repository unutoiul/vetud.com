import { createTheme, type CSSObject } from "@mui/material/styles"
import { brand, fonts } from "./tokens"

declare module "@mui/material/styles" {
  interface Palette {
    brand: typeof brand
    mint: Palette["primary"]
  }
  interface PaletteOptions {
    brand?: typeof brand
    mint?: PaletteOptions["primary"]
  }
  interface TypographyVariants {
    eyebrow: CSSObject
    mono: CSSObject
    serifAccent: CSSObject
    lead: CSSObject
  }
  interface TypographyVariantsOptions {
    eyebrow?: CSSObject
    mono?: CSSObject
    serifAccent?: CSSObject
    lead?: CSSObject
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    eyebrow: true
    mono: true
    serifAccent: true
    lead: true
  }
}

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    mint: true
  }
}

declare module "@mui/material/Chip" {
  interface ChipPropsColorOverrides {
    mint: true
  }
}

const focusRing = {
  outline: `2px solid ${brand.teal}`,
  outlineOffset: 2,
}

/**
 * The Pep Lab MUI theme: the Vetud concept's navy/mint laboratory look, with type sizes
 * raised for readability and focus states for keyboard users.
 */
export const pepLabTheme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: { main: brand.navySoft, dark: brand.navy, light: brand.blue, contrastText: "#fff" },
    secondary: { main: brand.teal, dark: "#176461", light: brand.tealBright, contrastText: "#fff" },
    mint: { main: brand.mintLight, dark: "#bfe9dc", light: "#effbf7", contrastText: "#103447" },
    success: { main: "#2e7d5b" },
    background: { default: brand.paper, paper: "#ffffff" },
    text: { primary: brand.ink, secondary: brand.muted },
    divider: brand.line,
    brand,
  },
  shape: { borderRadius: 4 },
  typography: {
    fontFamily: fonts.sans,
    fontSize: 15,
    h1: {
      fontWeight: 600,
      fontSize: "clamp(2.75rem, 6vw, 5.25rem)",
      lineHeight: 1,
      letterSpacing: "-0.055em",
    },
    h2: {
      fontWeight: 600,
      fontSize: "clamp(2.1rem, 4vw, 3rem)",
      lineHeight: 1.06,
      letterSpacing: "-0.045em",
    },
    h3: { fontWeight: 600, fontSize: "1.6rem", lineHeight: 1.15, letterSpacing: "-0.03em" },
    h4: { fontWeight: 600, fontSize: "1.3rem", lineHeight: 1.2, letterSpacing: "-0.02em" },
    h5: { fontWeight: 600, fontSize: "1.1rem", letterSpacing: "-0.01em" },
    h6: { fontWeight: 700, fontSize: "1rem" },
    body1: { fontSize: "1rem", lineHeight: 1.7 },
    body2: { fontSize: "0.9rem", lineHeight: 1.65 },
    button: { fontWeight: 700, letterSpacing: "0.06em" },
    lead: { fontSize: "1.075rem", lineHeight: 1.75 },
    eyebrow: {
      fontFamily: fonts.mono,
      fontSize: "0.75rem",
      fontWeight: 500,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      lineHeight: 1.5,
    },
    mono: { fontFamily: fonts.mono, fontSize: "0.8rem", letterSpacing: "0.04em" },
    serifAccent: {
      fontFamily: fonts.serif,
      fontStyle: "italic",
      fontWeight: 400,
      letterSpacing: "-0.02em",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: { scrollBehavior: "smooth" },
        "@keyframes vetud-spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "@keyframes vetud-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "::selection": { background: brand.mint, color: brand.ink },
        a: { color: "inherit" },
        ":focus-visible": focusRing,
        "@media (prefers-reduced-motion: reduce)": {
          "*, *::before, *::after": {
            animationDuration: "0.01ms !important",
            animationIterationCount: "1 !important",
            transitionDuration: "0.01ms !important",
            scrollBehavior: "auto !important",
          },
        },
      },
    },
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          eyebrow: "p",
          mono: "span",
          serifAccent: "span",
          lead: "p",
        },
      },
    },
    MuiButtonBase: {
      defaultProps: { disableRipple: true },
      styleOverrides: { root: { "&.Mui-focusVisible": focusRing } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 3,
          fontSize: "0.8rem",
          padding: "13px 20px",
          textTransform: "uppercase",
          transition: "background-color .2s, transform .2s, border-color .2s",
          "&:hover": { transform: "translateY(-1px)" },
        },
        sizeSmall: { padding: "8px 14px", fontSize: "0.72rem" },
        sizeLarge: { padding: "16px 24px", fontSize: "0.85rem" },
        outlined: { borderColor: brand.lineStrong },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: 4 } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: `1px solid ${brand.line}`,
          backgroundColor: "#fbfcfa",
          transition: "transform .25s, box-shadow .25s, border-color .25s",
        },
      },
    },
    MuiPaper: {
      styleOverrides: { outlined: { borderColor: brand.line } },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999, fontWeight: 600 },
        label: { paddingInline: 12 },
      },
    },
    MuiAccordion: {
      defaultProps: { disableGutters: true, elevation: 0, square: true },
      styleOverrides: {
        root: {
          backgroundColor: "transparent",
          borderBottom: `1px solid ${brand.lineStrong}`,
          "&::before": { display: "none" },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: { paddingInline: 0, minHeight: 72 },
        content: { margin: "18px 0", gap: 20, alignItems: "baseline" },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: { root: { padding: "0 0 22px 0" } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#fff",
          "& .MuiOutlinedInput-notchedOutline": { borderColor: brand.lineStrong },
        },
      },
    },
    MuiTextField: {
      defaultProps: { fullWidth: true },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "inherit" },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.95rem",
          minHeight: 52,
          paddingInline: 4,
          marginRight: 24,
          minWidth: 0,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { borderBottom: `1px solid ${brand.line}` },
        indicator: { backgroundColor: brand.teal, height: 2 },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          "&.Mui-active": { color: brand.teal },
          "&.Mui-completed": { color: brand.teal },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: { paper: { backgroundColor: brand.paper } },
    },
    MuiTooltip: {
      styleOverrides: { tooltip: { backgroundColor: brand.navy, fontSize: "0.75rem" } },
    },
    MuiLink: {
      defaultProps: { underline: "hover" },
      styleOverrides: { root: { fontWeight: 600 } },
    },
  },
})
