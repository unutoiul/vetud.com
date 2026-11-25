/**
 * The splash's two glass-ribbon artworks. They live here, outside the client components, because the
 * page head preloads the main one (SplashPreload) and that hint only helps when its file and `sizes`
 * match the <img> exactly; otherwise the browser downloads the artwork twice.
 *
 * `sizes` deliberately asks for a little less than the drawn width: the ribbons are faded, masked
 * and drift behind everything, so a slightly softer file looks the same and downloads much faster.
 */
export const SPLASH_RIBBONS = {
  /** The big ribbon in the lower left: the largest thing on screen while the splash is open. */
  main: {
    src: "/images/newsletter/ribbons-tirzepatide.webp",
    sizes: "(min-width: 1168px) 1120px, (min-width: 900px) calc(100vw - 48px), 130vw",
  },
  /** The softer ribbon in the top right. */
  second: {
    src: "/images/newsletter/ribbons-semaglutide.webp",
    sizes: "(min-width: 1120px) 784px, (min-width: 900px) 70vw, 100vw",
  },
} as const
