/** Pep Lab design tokens, taken from the Vetud concept and tuned for AA contrast. */
export const brand = {
  navy: "#082b3b",
  navyDeep: "#06212e",
  navySoft: "#0d3546",
  ink: "#112c3d",
  blue: "#23618a",
  cyan: "#3cc7c2",
  teal: "#1f7f7b",
  tealBright: "#4ac4bb",
  mint: "#a4ddd1",
  mintLight: "#d9f4eb",
  mintWash: "#eef5f2",
  paper: "#f7f8f5",
  line: "#dce5e4",
  lineStrong: "#c7d8d3",
  muted: "#55707a",
  onNavy: "#f6fbf8",
  onNavyMuted: "#a9c3c8",
} as const

export const fonts = {
  sans: "var(--font-manrope), 'Helvetica Neue', Arial, sans-serif",
  mono: "var(--font-dm-mono), 'SFMono-Regular', Menlo, monospace",
  serif: "var(--font-instrument-serif), Georgia, serif",
} as const

/** Page gutters shared by every section. */
export const gutter = { xs: 2, sm: 4, md: 6, lg: 10 } as const
