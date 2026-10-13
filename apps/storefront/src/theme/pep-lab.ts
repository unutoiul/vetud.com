import { createTheme, type CSSObject } from "@mui/material/styles"
import { brand, fonts, motion } from "./tokens"

declare module "@mui/material/styles" {
  interface Palette { brand: typeof brand; mint: Palette["primary"] }
  interface PaletteOptions { brand?: typeof brand; mint?: PaletteOptions["primary"] }
  interface TypographyVariants { eyebrow: CSSObject; mono: CSSObject; serifAccent: CSSObject; lead: CSSObject }
  interface TypographyVariantsOptions { eyebrow?: CSSObject; mono?: CSSObject; serifAccent?: CSSObject; lead?: CSSObject }
}
declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides { eyebrow: true; mono: true; serifAccent: true; lead: true }
}
declare module "@mui/material/Button" { interface ButtonPropsColorOverrides { mint: true } }
declare module "@mui/material/Chip" { interface ChipPropsColorOverrides { mint: true } }

const focusRing = { outline: `2px solid ${brand.blue}`, outlineOffset: 4 }

/** Shared Alpine design system, including transactional screens. */
export const pepLabTheme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: { main: brand.navy, dark: brand.navyDeep, light: brand.blue, contrastText: "#fff" },
    secondary: { main: brand.teal, dark: "#244c3e", light: brand.tealBright, contrastText: "#fff" },
    mint: { main: brand.mintLight, dark: "#d1e5da", light: "#f4f8f5", contrastText: brand.navy },
    success: { main: "#315f50" },
    background: { default: brand.paper, paper: "#fff" },
    text: { primary: brand.ink, secondary: brand.muted },
    divider: brand.line,
    brand,
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: fonts.sans,
    fontSize: 15,
    h1: { fontWeight: 500, fontSize: "clamp(3rem, 5.4vw, 5.4rem)", lineHeight: 1.08, letterSpacing: "-.06em" },
    h2: { fontWeight: 500, fontSize: "clamp(2.15rem, 3.6vw, 3.4rem)", lineHeight: 1.13, letterSpacing: "-.05em" },
    h3: { fontWeight: 550, fontSize: "1.65rem", lineHeight: 1.25, letterSpacing: "-.035em" },
    h4: { fontWeight: 550, fontSize: "1.28rem", lineHeight: 1.35, letterSpacing: "-.025em" },
    h5: { fontWeight: 600, fontSize: "1.12rem", letterSpacing: "-.02em" },
    h6: { fontWeight: 650, fontSize: "1rem" },
    body1: { fontSize: "1rem", lineHeight: 1.8 },
    body2: { fontSize: ".9rem", lineHeight: 1.7 },
    button: { fontWeight: 600, letterSpacing: "-.01em" },
    lead: { fontSize: "1.08rem", lineHeight: 1.85 },
    eyebrow: { fontFamily: fonts.sans, fontSize: ".78rem", fontWeight: 600, letterSpacing: ".025em", lineHeight: 1.6 },
    mono: { fontFamily: fonts.mono, fontSize: ".76rem", letterSpacing: ".015em" },
    serifAccent: { fontFamily: fonts.sans, fontStyle: "normal", fontWeight: "inherit", letterSpacing: "inherit" },
  },
  components: {
    MuiCssBaseline: { styleOverrides: {
      html: { scrollBehavior: "smooth", scrollPaddingTop: 120, colorScheme: "light" },
      body: { WebkitFontSmoothing: "antialiased" },
      "::selection": { background: brand.mint, color: brand.ink },
      a: { color: "inherit" },
      "a, button": { touchAction: "manipulation", WebkitTapHighlightColor: "rgba(54,125,171,.12)" },
      ":focus-visible": focusRing,
      "h1, h2, h3": { textWrap: "balance", scrollMarginTop: 120 },
      "@keyframes vetud-enter": { from: { opacity: 0, transform: "translateY(18px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      "@media (prefers-reduced-motion: reduce)": { "*, *::before, *::after": { animation: "none !important", transitionDuration: "0.01ms !important", scrollBehavior: "auto !important" } },
    } },
    MuiTypography: { defaultProps: { variantMapping: { eyebrow: "p", mono: "span", serifAccent: "span", lead: "p" } } },
    MuiButtonBase: { defaultProps: { disableRipple: true }, styleOverrides: { root: { "&.Mui-focusVisible": focusRing } } },
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: {
      root: { borderRadius: 999, fontSize: ".88rem", padding: "13px 24px", textTransform: "none", transition: `background-color .3s ${motion}, transform .3s ${motion}, border-color .3s ${motion}`, "&:hover": { transform: "translateY(-2px)" }, "&:active": { transform: "scale(.98)" } },
      endIcon: { marginLeft: 16, width: 30, height: 30, borderRadius: "50%", backgroundColor: "rgba(140,170,185,.14)", display: "grid", placeItems: "center", transition: `transform .35s ${motion}`, "& svg": { fontSize: "18px !important" }, ".MuiButton-root:hover &": { transform: "translate(2px,-1px)" } },
      sizeSmall: { padding: "9px 17px", fontSize: ".8rem" },
      sizeLarge: { padding: "13px 22px", fontSize: ".92rem" },
      outlined: { borderColor: brand.lineStrong, "&:hover": { borderColor: brand.blue, backgroundColor: "#edf4f7" } },
    } },
    MuiIconButton: { styleOverrides: { root: { borderRadius: "50%", minWidth: 44, minHeight: 44, transition: `background-color .3s ${motion}, transform .3s ${motion}`, "&:hover": { backgroundColor: "#e9f1f5" }, "&:active": { transform: "scale(.96)" } } } },
    MuiCard: { defaultProps: { elevation: 0 }, styleOverrides: { root: { border: "1px solid rgba(23,53,75,.055)", backgroundColor: "#fff", borderRadius: 24, transition: `transform .45s ${motion}, box-shadow .45s ${motion}` } } },
    MuiPaper: { styleOverrides: { outlined: { borderColor: "rgba(23,53,75,.08)", borderRadius: 20 }, elevation1: { boxShadow: "0 12px 50px rgba(18,51,76,.06)" } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 999, fontWeight: 550, fontSize: ".75rem" }, label: { paddingInline: 12 } } },
    MuiAccordion: { defaultProps: { disableGutters: true, elevation: 0, square: true }, styleOverrides: { root: { backgroundColor: "transparent", borderBottom: `1px solid ${brand.line}`, "&::before": { display: "none" } } } },
    MuiAccordionSummary: { styleOverrides: { root: { paddingInline: 0, minHeight: 80 }, content: { margin: "22px 0", gap: 20, alignItems: "center" } } },
    MuiAccordionDetails: { styleOverrides: { root: { padding: "0 0 26px" } } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 14, backgroundColor: "#fff", "& .MuiOutlinedInput-notchedOutline": { borderColor: brand.lineStrong }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: brand.blue } } } },
    MuiTextField: { defaultProps: { fullWidth: true } },
    MuiAppBar: { defaultProps: { elevation: 0, color: "inherit" } },
    MuiTab: { styleOverrides: { root: { textTransform: "none", fontWeight: 600, fontSize: ".95rem", minHeight: 58, paddingInline: 4, marginRight: 24, minWidth: 0 } } },
    MuiTabs: { styleOverrides: { root: { borderBottom: `1px solid ${brand.line}` }, indicator: { backgroundColor: brand.blue, height: 2 } } },
    MuiStepIcon: { styleOverrides: { root: { "&.Mui-active": { color: brand.navy }, "&.Mui-completed": { color: brand.teal } } } },
    MuiDrawer: { styleOverrides: { paper: { backgroundColor: brand.paper, overscrollBehavior: "contain" } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 24, overscrollBehavior: "contain" } } },
    MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: brand.navy, fontSize: ".75rem", borderRadius: 8 } } },
    MuiLink: { defaultProps: { underline: "hover" }, styleOverrides: { root: { fontWeight: 550 } } },
    MuiTableCell: { styleOverrides: { root: { fontVariantNumeric: "tabular-nums", borderBottomColor: brand.line, padding: "18px 16px" }, head: { fontWeight: 650, backgroundColor: "#f2f6f8" } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 16 } } },
  },
})
