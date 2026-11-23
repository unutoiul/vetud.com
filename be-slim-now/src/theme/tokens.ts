import type { ThemeConfig } from "antd"

/**
 * Every colour on the site. The palette comes from VETUD's product artwork: laboratory navy,
 * VETUD blue, glacier ice and brushed silver. Components use these names, never colour literals.
 */
export const colors = {
  navy: "#15265e",
  navyDeep: "#0d1838",
  navyInk: "#192b4a",
  blue: "#2c70d5",
  blueDeep: "#1b438f",
  blueSoft: "#3268aa",
  ice: "#dce9f7",
  iceLight: "#edf3fb",
  iceWash: "#f3f7fc",
  paper: "#fbfcfe",
  white: "#ffffff",
  silver: "#c5ced8",
  line: "#e2e8f0",
  lineStrong: "#cbd6e6",
  muted: "#67758b",
  onNavy: "#f5f9fb",
  onNavyMuted: "#b4c9d5",
  onNavyLine: "rgba(245, 249, 251, 0.14)",
  success: "#2f7a55",
  successWash: "#e8f4ee",
  warning: "#c07d12",
  error: "#b42318",
  shadow: "rgba(21, 38, 94, 0.10)",
  shadowStrong: "rgba(21, 38, 94, 0.18)",
  glass: "rgba(251, 252, 254, 0.78)",
  heroFade: "rgba(243, 247, 252, 0)",
  // The one accent: champagne gold. "sale" is its dark shade, readable on white (5:1).
  sale: "#94681a",
  saleDeep: "#6f4d12",
  saleWash: "#fbf6ea",
  saleBright: "#e8c77a",
  gold: "#d4af62",
  goldLight: "#f1dfae",
  goldDeep: "#8a6420",
  goldWash: "#fbf7ee",
  // Night scenes with glass ribbons (pop-up header, quality section).
  night: "#0a1230",
  nightLift: "#1b2b66",
  ribbonIce: "#8fd8f2",
  ribbonLavender: "#b9a6ec",
  ribbonGold: "#e8c77a",
  ribbonSheen: "#ffffff",
  clear: "rgba(0, 0, 0, 0)",
  /** The light that sweeps across the offer chip and the Buy button. */
  sheen: "rgba(255, 255, 255, 0.38)",
  nightGlass: "rgba(10, 18, 48, 0.55)",
  nightVeil: "rgba(10, 18, 48, 0.88)",
  sealShadow: "rgba(10, 18, 48, 0.32)",
  telegram: "#229ed9",
  whatsapp: "#25d366",
  line_app: "#06c755",
} as const

export const gradients = {
  hero: `linear-gradient(180deg, ${colors.iceWash} 0%, ${colors.paper} 100%)`,
  navy: `linear-gradient(135deg, ${colors.navyDeep} 0%, ${colors.navy} 55%, ${colors.blueDeep} 100%)`,
  accent: `linear-gradient(90deg, ${colors.blue} 0%, ${colors.blueDeep} 100%)`,
  card: `linear-gradient(180deg, ${colors.white} 0%, ${colors.iceWash} 100%)`,
  hot: `linear-gradient(135deg, ${colors.goldLight} 0%, ${colors.gold} 55%, ${colors.goldDeep} 100%)`,
  popular: `linear-gradient(135deg, ${colors.navy} 0%, ${colors.navyDeep} 100%)`,
  promoBar: `linear-gradient(90deg, ${colors.navyDeep} 0%, ${colors.navy} 50%, ${colors.navyDeep} 100%)`,
  champagneText: `linear-gradient(180deg, ${colors.goldLight} 0%, ${colors.gold} 60%, ${colors.goldDeep} 100%)`,
  night: `radial-gradient(circle at 25% 15%, ${colors.nightLift} 0%, ${colors.night} 62%)`,
  /** Darkens the bottom of artwork so a label on it stays readable. */
  artFade: `linear-gradient(180deg, ${colors.clear} 0%, ${colors.nightGlass} 45%, ${colors.nightVeil} 100%)`,
  /** Darkens the middle of a ribbon scene so text on it stays readable. */
  nightScrim: `radial-gradient(ellipse 58% 62% at 50% 50%, ${colors.nightVeil} 0%, ${colors.nightVeil} 45%, ${colors.clear} 100%)`,
  heroSide: `linear-gradient(90deg, ${colors.paper} 0%, rgba(251, 252, 254, 0.86) 38%, rgba(251, 252, 254, 0) 70%)`,
  heroScrim: `linear-gradient(180deg, ${colors.heroFade} 55%, ${colors.paper} 100%)`,
  /** A band of light that slides across a button or chip. */
  shine: `linear-gradient(105deg, ${colors.clear} 0%, ${colors.sheen} 50%, ${colors.clear} 100%)`,
  /** "40% off." in the hero: dark champagne with a brighter band that glides through it. */
  saleShimmer: `linear-gradient(100deg, ${colors.sale} 0%, ${colors.sale} 38%, ${colors.gold} 50%, ${colors.sale} 62%, ${colors.sale} 100%)`,
  /** Soft ice light behind the hero pens. */
  penGlow: `radial-gradient(circle at 50% 50%, ${colors.ice} 0%, ${colors.clear} 68%)`,
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
    colorPrimary: colors.navy,
    colorInfo: colors.blue,
    colorLink: colors.blueSoft,
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
    Button: { fontWeight: 600, primaryShadow: "none", contentFontSizeLG: 16 },
    Card: { borderRadiusLG: 20 },
    Segmented: { itemSelectedBg: colors.navy, itemSelectedColor: colors.onNavy, trackBg: colors.iceLight, trackPadding: 4 },
    Collapse: { headerBg: colors.white, contentBg: colors.white },
    Modal: { borderRadiusLG: 20 },
    Form: { itemMarginBottom: 16, verticalLabelPadding: "0 0 4px" },
    Steps: { colorPrimary: colors.blue },
    Statistic: { contentFontSize: 40, titleFontSize: 13 },
    // Country lists: a light ice row for the chosen country instead of antd's grey derived from navy.
    Select: { optionSelectedBg: colors.iceLight, optionSelectedColor: colors.navy, optionActiveBg: colors.iceWash, optionSelectedFontWeight: 600 },
  },
}
