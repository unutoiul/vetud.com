import type { ThemeConfig } from "antd"

/**
 * Every colour on the site, taken from the BeSlimNow logo: the navy of its lettering, the teal of
 * "Slim", aqua washes from the B's upper bowl, and the green-to-lime of its lower bowl as the one
 * offer accent. Teal is the brand (buttons, links, icons); green-lime only marks the offer and
 * savings. Components use these names, never colour literals.
 */
export const colors = {
  // Navy: the logo's lettering.
  navy: "#072542",
  navyDeep: "#041a2e",
  navyInk: "#0d2a42",
  // Teal: "Slim". Plain teal is for icons, dots and rules; tealDeep is the readable shade for text,
  // links and buttons with white labels (4.8:1), with darker hover and press shades.
  teal: "#01afa2",
  tealDeep: "#008176",
  tealHover: "#00756b",
  tealPress: "#00695f",
  /** Teal on night backgrounds. */
  tealBright: "#7fe3da",
  // Aqua washes and lines, tinted toward the teal.
  aqua: "#d4efec",
  aquaLight: "#e8f6f4",
  aquaWash: "#f2faf9",
  paper: "#fbfdfd",
  white: "#ffffff",
  line: "#dfeae9",
  lineStrong: "#c5d9d7",
  muted: "#5c7080",
  onNavy: "#f3fafa",
  onNavyMuted: "#a9c6cc",
  onNavyLine: "rgba(243, 250, 250, 0.14)",
  success: "#177f35",
  successWash: "#e7f5ea",
  warning: "#c07d12",
  error: "#b42318",
  shadow: "rgba(7, 37, 66, 0.10)",
  shadowStrong: "rgba(7, 37, 66, 0.18)",
  glass: "rgba(251, 253, 253, 0.8)",
  heroFade: "rgba(242, 250, 249, 0)",
  // The one accent, for the offer and savings: the B's lower bowl, green to lime.
  // "sale" is its dark shade, readable on white (5.5:1); "saleDeep" sits on limeWash.
  sale: "#08794c",
  saleDeep: "#065c39",
  green: "#03a169",
  lime: "#79e63d",
  limeLight: "#c5f2a0",
  limeWash: "#f1fbe9",
  // Night scenes (offer strip, seal, pop-up header, quality section).
  night: "#041a2e",
  nightLift: "#0c3f5e",
  clear: "rgba(0, 0, 0, 0)",
  /** The light that sweeps across the offer chip and the Buy button. */
  sheen: "rgba(255, 255, 255, 0.38)",
  nightGlass: "rgba(4, 26, 46, 0.55)",
  nightVeil: "rgba(4, 26, 46, 0.88)",
  sealShadow: "rgba(4, 26, 46, 0.32)",
  telegram: "#229ed9",
  whatsapp: "#25d366",
  line_app: "#06c755",
} as const

export const gradients = {
  hero: `linear-gradient(180deg, ${colors.aquaWash} 0%, ${colors.paper} 100%)`,
  /** The best seller's badge, the offer chip and the seal's rim: the B's lower bowl. */
  hot: `linear-gradient(135deg, ${colors.limeLight} 0%, ${colors.lime} 50%, ${colors.green} 100%)`,
  popular: `linear-gradient(135deg, ${colors.navy} 0%, ${colors.navyDeep} 100%)`,
  /** Offer numbers on night backgrounds. */
  glowText: `linear-gradient(180deg, ${colors.limeLight} 0%, ${colors.lime} 55%, ${colors.green} 100%)`,
  night: `radial-gradient(circle at 25% 15%, ${colors.nightLift} 0%, ${colors.night} 62%)`,
  /** Darkens the bottom of artwork so a label on it stays readable. */
  artFade: `linear-gradient(180deg, ${colors.clear} 0%, ${colors.nightGlass} 45%, ${colors.nightVeil} 100%)`,
  /** Darkens the middle of a ribbon scene so text on it stays readable. */
  nightScrim: `radial-gradient(ellipse 58% 62% at 50% 50%, ${colors.nightVeil} 0%, ${colors.nightVeil} 45%, ${colors.clear} 100%)`,
  heroSide: `linear-gradient(90deg, ${colors.paper} 0%, rgba(251, 253, 253, 0.86) 38%, rgba(251, 253, 253, 0) 70%)`,
  heroScrim: `linear-gradient(180deg, ${colors.heroFade} 55%, ${colors.paper} 100%)`,
  /** A band of light that slides across a button or chip. */
  shine: `linear-gradient(105deg, ${colors.clear} 0%, ${colors.sheen} 50%, ${colors.clear} 100%)`,
  /** The hero's "NN% off.": deep green with a brighter green band that glides through it. */
  saleShimmer: `linear-gradient(100deg, ${colors.sale} 0%, ${colors.sale} 38%, ${colors.green} 50%, ${colors.sale} 62%, ${colors.sale} 100%)`,
  /** Soft aqua light behind the hero pens. */
  penGlow: `radial-gradient(circle at 50% 50%, ${colors.aqua} 0%, ${colors.clear} 68%)`,
} as const

export const fonts = {
  display: "var(--font-display), 'Century Gothic', 'Helvetica Neue', Arial, sans-serif",
  body: "var(--font-body), 'Helvetica Neue', Arial, sans-serif",
  mono: "var(--font-mono), 'SFMono-Regular', Menlo, monospace",
} as const

export const shadows = {
  card: `0 1px 2px ${colors.shadow}, 0 12px 32px -12px ${colors.shadow}`,
  lifted: `0 2px 4px ${colors.shadow}, 0 24px 48px -16px ${colors.shadowStrong}`,
} as const

export const theme: ThemeConfig = {
  token: {
    colorPrimary: colors.tealDeep,
    colorInfo: colors.teal,
    colorLink: colors.tealDeep,
    colorSuccess: colors.success,
    colorWarning: colors.warning,
    colorError: colors.error,
    colorText: colors.navyInk,
    colorTextSecondary: colors.muted,
    colorBorder: colors.lineStrong,
    colorBorderSecondary: colors.line,
    colorBgLayout: colors.paper,
    colorBgContainer: colors.white,
    fontFamily: fonts.body,
    fontFamilyCode: fonts.mono,
    fontSize: 15,
    borderRadius: 10,
    borderRadiusLG: 16,
    controlHeight: 42,
    controlHeightLG: 52,
  },
  components: {
    // Darker on hover and press, so the white label never drops below 4.5:1.
    Button: {
      fontWeight: 600,
      primaryShadow: "none",
      contentFontSizeLG: 16,
      colorPrimaryHover: colors.tealHover,
      colorPrimaryActive: colors.tealPress,
    },
    Card: { borderRadiusLG: 20 },
    Segmented: { itemSelectedBg: colors.tealDeep, itemSelectedColor: colors.white, trackBg: colors.aquaLight, trackPadding: 4 },
    Collapse: { headerBg: colors.white, contentBg: colors.white },
    Modal: { borderRadiusLG: 20 },
    Form: { itemMarginBottom: 16, verticalLabelPadding: "0 0 4px" },
    Steps: { colorPrimary: colors.tealDeep },
    Statistic: { contentFontSize: 40, titleFontSize: 13 },
    // Country lists: a light aqua row for the chosen country instead of antd's grey.
    // Text fields at 16px: phones (iOS Safari) zoom the whole page into any field smaller than that
    // when it's tapped, and the page stays zoomed. The country lists' search box is the Select's.
    Select: { fontSize: 16, optionSelectedBg: colors.aquaLight, optionSelectedColor: colors.navy, optionActiveBg: colors.aquaWash, optionSelectedFontWeight: 600 },
    Input: { fontSize: 16 },
    InputNumber: { fontSize: 16 },
  },
}
