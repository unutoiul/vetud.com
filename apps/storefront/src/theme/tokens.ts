/** VETUD Peptide Series: porcelain, glacier blue and laboratory navy. */
export const brand = {
  navy: "#15265e",
  navyDeep: "#101c42",
  navySoft: "#34466b",
  ink: "#192b4a",
  blue: "#3268aa",
  cyan: "#8fc6dd",
  teal: "#386d86",
  tealBright: "#abcce3",
  mint: "#dce9f7",
  mintLight: "#edf3fb",
  mintWash: "#f3f7fc",
  paper: "#fbfcfe",
  line: "#e2e8f0",
  lineStrong: "#cbd6e6",
  muted: "#67758b",
  onNavy: "#f5f9fb",
  onNavyMuted: "#b4c9d5",
} as const

export const fonts = {
  sans: "var(--font-manrope), sans-serif",
  mono: "var(--font-dm-mono), monospace",
} as const

/** Page gutters shared by every section. */
export const gutter = { xs: 2.5, sm: 4, md: 6, lg: 8 } as const
export const motion = "cubic-bezier(.22,.68,0,1.05)"
