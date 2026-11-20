import { createTheme, type CSSObject } from "@mui/material/styles"
import { brand, fonts, motion } from "./tokens"

declare module "@mui/material/styles" {
  interface Palette { brand: typeof brand; mint: Palette["primary"] }
  interface PaletteOptions { brand?: typeof brand; mint?: PaletteOptions["primary"] }
  interface TypographyVariants { eyebrow: CSSObject; mono: CSSObject; lead: CSSObject }
  interface TypographyVariantsOptions { eyebrow?: CSSObject; mono?: CSSObject; lead?: CSSObject }
}
declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides { eyebrow: true; mono: true; lead: true }
}
declare module "@mui/material/Button" { interface ButtonPropsColorOverrides { mint: true } }
declare module "@mui/material/Chip" { interface ChipPropsColorOverrides { mint: true } }

const focusRing = { outline: `2px solid ${brand.blue}`, outlineOffset: 4 }

/**
 * Browser autofill paints filled fields pale blue, but only behind the text, so forms looked
 * patchy (owner, 2026-11-18). Filled fields keep the field's own white and ink instead; autofill
 * itself still works. The long transition stops Chrome from flashing its colour back.
 */
const autofill = {
  WebkitBoxShadow: `0 0 0 1000px ${brand.white} inset`,
  boxShadow: `0 0 0 1000px ${brand.white} inset`,
  WebkitTextFillColor: brand.ink,
  caretColor: brand.ink,
  borderRadius: "inherit",
  transition: "background-color 600000s 0s, color 600000s 0s",
}

/** Shared Alpine design system, including transactional screens. */
export const pepLabTheme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: { main: brand.navy, dark: brand.navyDeep, light: brand.blue, contrastText: brand.white },
    secondary: { main: brand.teal, dark: brand.green775_2, light: brand.tealBright, contrastText: brand.white },
    mint: { main: brand.mintLight, dark: brand.stone150, light: brand.stone25, contrastText: brand.navy },
    success: { main: brand.teal725_2 },
    background: { default: brand.paper, paper: brand.white },
    text: { primary: brand.ink, secondary: brand.muted },
    divider: brand.line,
    brand,
  },
  shape: { borderRadius: 4 },
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
  },
  components: {
    MuiCssBaseline: { styleOverrides: {
      html: { scrollBehavior: "smooth", scrollPaddingTop: 120, colorScheme: "light" },
      body: { WebkitFontSmoothing: "antialiased" },
      "::selection": { background: brand.mint, color: brand.ink },
      a: { color: "inherit" },
      "a, button": { touchAction: "manipulation", WebkitTapHighlightColor: brand.blue550A12 },
      ":focus-visible": focusRing,
      "h1, h2, h3": { textWrap: "balance", scrollMarginTop: 120 },
      "@keyframes vetud-enter": { from: { opacity: 0, transform: "translateY(18px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      "@media (prefers-reduced-motion: reduce)": { "*, *::before, *::after": { animation: "none !important", transitionDuration: "0.01ms !important", scrollBehavior: "auto !important" } },
    } },
    MuiTypography: { defaultProps: { variantMapping: { eyebrow: "p", mono: "span", lead: "p" } } },
    MuiButtonBase: { defaultProps: { disableRipple: true }, styleOverrides: { root: { "&.Mui-focusVisible": focusRing } } },
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: {
      root: { borderRadius: 5, fontSize: ".88rem", padding: "13px 24px", textTransform: "none", transition: `background-color .3s ${motion}, transform .3s ${motion}, border-color .3s ${motion}`, "&:hover": { transform: "translateY(-2px)" }, "&:active": { transform: "scale(.98)" } },
      endIcon: { marginLeft: 16, width: 20, height: 24, borderRadius: 0, backgroundColor: "transparent", display: "grid", placeItems: "center", transition: `transform .35s ${motion}`, "& svg": { fontSize: "18px !important" }, ".MuiButton-root:hover &": { transform: "translate(2px,-1px)" } },
      sizeSmall: { padding: "9px 17px", fontSize: ".8rem" },
      sizeLarge: { padding: "13px 22px", fontSize: ".92rem" },
      outlined: { borderColor: brand.lineStrong, "&:hover": { borderColor: brand.blue, backgroundColor: brand.blue50_2 } },
    } },
    MuiIconButton: { styleOverrides: { root: { borderRadius: "50%", minWidth: 44, minHeight: 44, transition: `background-color .3s ${motion}, transform .3s ${motion}`, "&:hover": { backgroundColor: brand.blue75 }, "&:active": { transform: "scale(.96)" } } } },
    MuiCard: { defaultProps: { elevation: 0 }, styleOverrides: { root: { border: `1px solid ${brand.blue800A06}`, backgroundColor: brand.white, borderRadius: 6, transition: `transform .45s ${motion}, box-shadow .45s ${motion}` } } },
    MuiPaper: { styleOverrides: { outlined: { borderColor: brand.blue800A08, borderRadius: 6 }, elevation1: { boxShadow: `0 12px 50px ${brand.blue825A06}` } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 999, fontWeight: 550, fontSize: ".75rem" }, label: { paddingInline: 12 } } },
    MuiAccordion: { defaultProps: { disableGutters: true, elevation: 0, square: true }, styleOverrides: { root: { backgroundColor: "transparent", borderBottom: `1px solid ${brand.line}`, "&::before": { display: "none" } } } },
    MuiAccordionSummary: { styleOverrides: { root: { paddingInline: 0, minHeight: 80 }, content: { margin: "22px 0", gap: 20, alignItems: "center" } } },
    MuiAccordionDetails: { styleOverrides: { root: { padding: "0 0 26px" } } },
    // Every text field, select and autocomplete shares this look (the same as the shop's).
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6, backgroundColor: brand.white,
          transition: `box-shadow .2s ${motion}`,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: brand.lineStrong, transition: `border-color .2s ${motion}` },
          "&:hover:not(.Mui-disabled):not(.Mui-error) .MuiOutlinedInput-notchedOutline": { borderColor: brand.navySoft },
          "&.Mui-focused:not(.Mui-error) .MuiOutlinedInput-notchedOutline": { borderColor: brand.blue, borderWidth: 2 },
          "&.Mui-focused": { boxShadow: `0 0 0 4px ${brand.mintLight}` },
          "&.Mui-disabled": { backgroundColor: brand.mintWash },
          "& input:-webkit-autofill": autofill,
          "& input:-webkit-autofill:hover": autofill,
          "& input:-webkit-autofill:focus": autofill,
          "& input:autofill": autofill,
        },
        input: { "&::placeholder": { color: brand.muted, opacity: 1 } },
        adornedStart: { "& .MuiInputAdornment-root": { color: brand.ink } },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { color: brand.muted, "&.Mui-focused:not(.Mui-error)": { color: brand.blue } }, asterisk: { color: brand.muted } } },
    MuiFormHelperText: { styleOverrides: { root: { marginTop: 6, fontSize: ".78rem", lineHeight: 1.45, color: brand.muted, "&.Mui-error": { color: brand.red600 } } } },
    MuiAutocomplete: { styleOverrides: { paper: { borderRadius: 8, marginTop: 4, boxShadow: `0 12px 40px ${brand.blue825A12}`, border: `1px solid ${brand.line}` }, option: { minHeight: 44 }, noOptions: { color: brand.muted } } },
    MuiTextField: { defaultProps: { fullWidth: true } },
    MuiAppBar: { defaultProps: { elevation: 0, color: "inherit" } },
    MuiTab: { styleOverrides: { root: { textTransform: "none", fontWeight: 600, fontSize: ".95rem", minHeight: 58, paddingInline: 4, marginRight: 24, minWidth: 0 } } },
    MuiTabs: { styleOverrides: { root: { borderBottom: `1px solid ${brand.line}` }, indicator: { backgroundColor: brand.blue, height: 2 } } },
    MuiStepIcon: { styleOverrides: { root: { "&.Mui-active": { color: brand.navy }, "&.Mui-completed": { color: brand.teal } } } },
    MuiDrawer: { styleOverrides: { paper: { backgroundColor: brand.paper, overscrollBehavior: "contain" } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 24, overscrollBehavior: "contain" } } },
    MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: brand.navy, fontSize: ".75rem", borderRadius: 8 } } },
    MuiLink: { defaultProps: { underline: "hover" }, styleOverrides: { root: { fontWeight: 550 } } },
    MuiTableCell: { styleOverrides: { root: { fontVariantNumeric: "tabular-nums", borderBottomColor: brand.line, padding: "18px 16px" }, head: { fontWeight: 650, backgroundColor: brand.blue50_3 } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 5 } } },
  },
})
