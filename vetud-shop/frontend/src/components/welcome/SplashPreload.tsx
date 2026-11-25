import { getImageProps } from "next/image"
import { preload } from "react-dom"
import { SPLASH_RIBBONS } from "./splash-art"

/**
 * Puts a high-priority preload for the splash's main ribbon in the page head.
 *
 * The splash can only open after the page's JavaScript has run (whether to show it depends on this
 * browser's storage), and its ribbon is the page's largest paint (LCP). Without this hint the
 * artwork only starts downloading once the splash opens; with it, it's already loaded by then.
 * Visitors who never see the splash download one cached image for nothing, which is the trade-off.
 */
export default function SplashPreload() {
  const { main } = SPLASH_RIBBONS
  // The same props next/image gives the <img>, so the browser reuses this download for it.
  const { props } = getImageProps({ src: main.src, alt: "", fill: true, sizes: main.sizes })
  preload(props.src, { as: "image", imageSrcSet: props.srcSet, imageSizes: props.sizes, fetchPriority: "high" })
  return null
}
