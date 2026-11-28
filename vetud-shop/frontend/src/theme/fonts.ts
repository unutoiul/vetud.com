// The site's two typefaces, self-hosted from public/fonts and declared through MUI (<GlobalStyles> in
// ThemeRegistry), so the site ships no .css file at all: no stylesheet request blocks the first paint.
// Replaced next/font on 2026-11-27 (its @font-face rules came as a render-blocking .css chunk).
//
// Files are Google Fonts' own woff2 subsets (Manrope v23, variable 200–800; DM Mono v16, 400 + 500).
// The version is in each file name because next.config caches /fonts/* for a year: a new font
// version needs new file names. The browser only downloads a subset when the page uses its letters.

const LATIN =
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"
const LATIN_EXT =
  "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF"
const CYRILLIC_EXT = "U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F"
const CYRILLIC = "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116"
const GREEK = "U+0370-0377,U+037A-037F,U+0384-038A,U+038C,U+038E-03A1,U+03A3-03FF"
const VIETNAMESE =
  "U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB"

/** The files every page needs first; the layout preloads them. */
export const preloadFonts = [
  "/fonts/manrope-v23-latin.woff2",
  "/fonts/dm-mono-400-v16-latin.woff2",
  "/fonts/dm-mono-500-v16-latin.woff2",
]

const faces: [family: string, weight: string, file: string, range: string][] = [
  ["Manrope", "200 800", "manrope-v23-cyrillic-ext", CYRILLIC_EXT],
  ["Manrope", "200 800", "manrope-v23-cyrillic", CYRILLIC],
  ["Manrope", "200 800", "manrope-v23-greek", GREEK],
  ["Manrope", "200 800", "manrope-v23-vietnamese", VIETNAMESE],
  ["Manrope", "200 800", "manrope-v23-latin-ext", LATIN_EXT],
  ["Manrope", "200 800", "manrope-v23-latin", LATIN],
  ["DM Mono", "400", "dm-mono-400-v16-latin-ext", LATIN_EXT],
  ["DM Mono", "400", "dm-mono-400-v16-latin", LATIN],
  ["DM Mono", "500", "dm-mono-500-v16-latin-ext", LATIN_EXT],
  ["DM Mono", "500", "dm-mono-500-v16-latin", LATIN],
]

// Arial resized to each font's measurements (values next/font computed), so text doesn't jump
// when the real font arrives.
const fallbacks = [
  `@font-face{font-family:"Manrope Fallback";src:local("Arial");ascent-override:103.31%;descent-override:29.07%;line-gap-override:0%;size-adjust:103.19%}`,
  `@font-face{font-family:"DM Mono Fallback";src:local("Arial");ascent-override:73.71%;descent-override:23.03%;line-gap-override:0%;size-adjust:134.59%}`,
]

export const fontFaces = [
  ...faces.map(
    ([family, weight, file, range]) =>
      `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};font-display:swap;src:url(/fonts/${file}.woff2) format("woff2");unicode-range:${range}}`,
  ),
  ...fallbacks,
].join("")
