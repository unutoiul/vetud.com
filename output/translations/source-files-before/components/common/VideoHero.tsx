import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import type { ReactNode } from "react"
import { gutter } from "@/theme/tokens"
import HeroVideo, { type HeroVideoSource } from "./HeroVideo"

/** The wide hero videos (1920×500) are this colour across their left third, so the text sits on the video itself. */
const VIDEO_PAPER = "#f8fafb"

export const SHOP_HERO_VIDEO: HeroVideoSource = { src: "/videos/shop-hero.mp4", poster: "/videos/shop-hero.webp" }

type VideoHeroProps = { eyebrow: string; title: ReactNode; description?: ReactNode; children?: ReactNode; video: HeroVideoSource }

/** A page header like PageHeader, over a wide looping video whose subject sits on the right. */
export default function VideoHero({ eyebrow, title, description, children, video }: VideoHeroProps) {
  return <Box component="header" sx={{ position: "relative", overflow: "hidden", bgcolor: VIDEO_PAPER, borderBottom: "1px solid", borderColor: "divider", minHeight: { md: 440 } }}>
    <Box sx={{ position: "relative", zIndex: 1, px: gutter, pt: { xs: 5, md: 8 }, pb: { xs: 3.5, md: 8 } }}>
      <Box sx={{ maxWidth: 1360, mx: "auto" }}>
        <Box sx={{ maxWidth: { md: 540 } }}>
          <Typography variant="mono" component="p" sx={{ color: "brand.blue", fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase" }}>VETUD / {eyebrow}</Typography>
          <Typography variant="h1" component="h1" sx={{ mt: 2.75, fontSize: { xs: 39, sm: 52, md: 54 }, fontWeight: 400, lineHeight: 1.12, letterSpacing: "-.055em" }}>{title}</Typography>
          {description ? <Typography sx={{ color: "text.secondary", mt: 2.5, maxWidth: 640, fontSize: { xs: 15, md: 16 }, lineHeight: 1.85 }}>{description}</Typography> : null}
          {children ? <Box sx={{ mt: 3 }}>{children}</Box> : null}
        </Box>
      </Box>
    </Box>
    <HeroVideo {...video} />
    {/* Where the video's subject reaches under the text on narrower screens, fade it out behind the text. */}
    <Box aria-hidden sx={{
      display: { xs: "none", md: "block" }, position: "absolute", inset: 0, pointerEvents: "none",
      "--text-start": { md: "48px", lg: "max(64px, (100% - 1360px) / 2)" },
      background: `linear-gradient(90deg, ${VIDEO_PAPER} calc(var(--text-start) + 500px), rgb(248 250 251 / 0) calc(var(--text-start) + 680px))`,
    }} />
  </Box>
}
