"use client"

import Box from "@mui/material/Box"
import { alpha, keyframes, type SxProps, type Theme } from "@mui/material/styles"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import type { ReactNode } from "react"
import { brand } from "@/theme/tokens"
import Icon from "../brand/Icon"

export type PreviewStory = { kicker: string; title: string; image: string }

const rise = keyframes`
  from { opacity: 0; transform: translateY(18px) rotate(-2deg); }
  to { opacity: 1; transform: translateY(0) rotate(-2deg); }
`
const float = keyframes`
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-8px) rotate(-2deg); }
`
const drift = keyframes`
  0%, 100% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.04) rotate(2deg); }
`
const pop = keyframes`
  from { opacity: 0; transform: translateY(8px) scale(.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`

/** Where the three "what you get" chips sit around the card on wider screens. */
const CHIP_PLACES = [
  { top: "6%", left: "-2%" },
  { top: "44%", right: "-4%" },
  { bottom: "5%", left: "4%" },
]

/**
 * The sign-up splash's picture: one of VETUD's glass-ribbon artworks glowing behind a preview of
 * the newsletter email, with a few stories from it and what subscribers get. It's an illustration,
 * so assistive technology reads only its label.
 */
export default function NewsletterPreview({ art, label, subject, stories, chips, sx }: {
  /** A glass-ribbon artwork right behind the card; leave it out when the page behind is busy already. */
  art?: string
  label: string
  subject: string
  stories: PreviewStory[]
  chips: ReactNode[]
  sx?: SxProps<Theme>
}) {
  return <Box component="figure" role="img" aria-label={label} sx={[{
    position: "relative",
    display: "grid",
    placeItems: "center",
    width: "100%",
    minWidth: 0,
    height: { xs: 236, sm: 300, md: 430 },
    m: 0,
  }, ...(Array.isArray(sx) ? sx : [sx])]}>
    {/* The glass ribbons, faded out before the artwork's own dark background ends. The box has the
        artwork's 3:2 shape, so the fade reaches every edge. */}
    {art && <Box aria-hidden sx={{
      position: "absolute",
      left: "50%",
      top: "50%",
      translate: "-50% -50%",
      width: { xs: "135%", md: "118%" },
      aspectRatio: "3 / 2",
      maskImage: "radial-gradient(closest-side, black 55%, transparent 98%)",
      animation: `${drift} 14s ease-in-out infinite`,
      "@media (prefers-reduced-motion: reduce)": { animation: "none" },
    }}>
      <Image src={art} alt="" fill preload sizes="(min-width: 900px) 760px, 100vw" style={{ objectFit: "contain" }} />
    </Box>}

    {/* The email itself. */}
    <Box sx={{
      position: "relative",
      width: { xs: "min(100%, 330px)", sm: 380, md: "min(100%, 440px)" },
      p: { xs: "14px 14px 6px", md: "20px 20px 8px" },
      borderRadius: { xs: "18px", md: "22px" },
      color: "brand.onNavy",
      bgcolor: alpha(brand.navyDeep, .74),
      backdropFilter: "blur(16px)",
      border: `1px solid ${alpha(brand.cyan, .28)}`,
      boxShadow: `0 34px 80px ${brand.blackA22}, inset 0 1px 0 ${alpha(brand.onNavy, .12)}`,
      transform: "rotate(-2deg)",
      animation: `${rise} 700ms 120ms cubic-bezier(.2, .75, .22, 1) both, ${float} 7s 900ms ease-in-out infinite`,
      "@media (prefers-reduced-motion: reduce)": { animation: "none" },
    }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <Box sx={{ display: "grid", placeItems: "center", width: 38, height: 38, flexShrink: 0, borderRadius: "50%", bgcolor: "brand.mintLight" }}>
          <Image src="/brand/vetud-mark.svg" alt="" width={24} height={21} style={{ display: "block", width: 24, height: "auto" }} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography translate="no" sx={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.2 }}>VETUD</Typography>
          <Typography sx={{ fontSize: 12, color: "brand.onNavyMuted", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subject}</Typography>
        </Box>
        <Box sx={{ display: "grid", placeItems: "center", width: 30, height: 30, flexShrink: 0, borderRadius: "50%", color: "brand.navy", bgcolor: "brand.cyan" }}>
          <Icon name="mail" sx={{ width: 16, height: 16 }} />
        </Box>
      </Box>

      <Box component="ul" role="list" sx={{ listStyle: "none", m: { xs: "10px 0 0", md: "14px 0 0" }, p: 0 }}>
        {stories.map((story, index) => <Box component="li" key={story.title} sx={{
          display: index > 1 ? { xs: "none", sm: "flex" } : "flex",
          alignItems: "center",
          gap: { xs: 1.25, md: 1.5 },
          py: { xs: 1, md: 1.35 },
          borderTop: "1px solid",
          borderColor: alpha(brand.cyan, .16),
        }}>
          <Box sx={{ position: "relative", flexShrink: 0, width: { xs: 74, md: 92 }, aspectRatio: "16 / 10", borderRadius: "10px", overflow: "hidden", bgcolor: "brand.navy" }}>
            <Image src={story.image} alt="" fill sizes="92px" style={{ objectFit: "cover" }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: .25, color: "brand.cyan", fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>{story.kicker}</Typography>
            <Typography sx={{
              fontSize: { xs: 12.5, md: 13.5 },
              fontWeight: 600,
              lineHeight: 1.35,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>{story.title}</Typography>
          </Box>
        </Box>)}
      </Box>
    </Box>

    {/* What subscribers get, floating around the card. */}
    {chips.map((chip, index) => <Box key={index} sx={{
      position: "absolute",
      ...CHIP_PLACES[index % CHIP_PLACES.length],
      display: { xs: "none", md: "inline-flex" },
      alignItems: "center",
      gap: 1,
      p: "8px 14px 8px 10px",
      borderRadius: 999,
      fontSize: 13,
      fontWeight: 600,
      color: "brand.onNavy",
      bgcolor: alpha(brand.navy, .82),
      backdropFilter: "blur(10px)",
      border: `1px solid ${alpha(brand.cyan, .3)}`,
      boxShadow: `0 14px 30px ${brand.blackA22}`,
      animation: `${pop} 500ms ${500 + index * 140}ms ease-out both`,
      "@media (prefers-reduced-motion: reduce)": { animation: "none" },
    }}>
      <Box component="span" sx={{ display: "grid", placeItems: "center", width: 22, height: 22, borderRadius: "50%", color: "brand.navy", bgcolor: "brand.cyan" }}>
        <Icon name="check" sx={{ width: 14, height: 14 }} />
      </Box>
      {chip}
    </Box>)}
  </Box>
}
