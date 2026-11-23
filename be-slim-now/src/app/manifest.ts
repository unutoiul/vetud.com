import type { MetadataRoute } from "next"
import { colors } from "@/theme/tokens"

/** Name and icon when the page is saved to a phone's home screen. Icons come from `npm run brand`. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BeSlimNow",
    short_name: "BeSlimNow",
    start_url: "/",
    display: "browser",
    background_color: colors.white,
    theme_color: colors.navy,
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
