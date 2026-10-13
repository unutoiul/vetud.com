/** VETUD Alpine: cool porcelain, mineral blue and botanical green. */
export const brand = {
  navy: "#12334c",
  navyDeep: "#0b263b",
  navySoft: "#20475e",
  ink: "#17354b",
  blue: "#367dab",
  cyan: "#8fc6dd",
  teal: "#315f50",
  tealBright: "#a5c6b5",
  mint: "#d1e5da",
  mintLight: "#e7f1eb",
  mintWash: "#eff5f6",
  paper: "#f7f9fa",
  line: "#e3ebee",
  lineStrong: "#cbdbe2",
  muted: "#637684",
  onNavy: "#f5f9fb",
  onNavyMuted: "#b4c9d5",
} as const

export const fonts = {
  sans: "var(--font-manrope), sans-serif",
  mono: "var(--font-dm-mono), monospace",
  serif: "var(--font-instrument-serif), Georgia, serif",
} as const

/** Page gutters shared by every section. */
export const gutter = { xs: 2.5, sm: 4, md: 6, lg: 8 } as const
export const motion = "cubic-bezier(.22,.68,0,1.05)"
