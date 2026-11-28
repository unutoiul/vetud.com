"use client"

import Box from "@mui/material/Box"
import { alpha, keyframes, type SxProps, type Theme } from "@mui/material/styles"
import Image from "next/image"
import { brand } from "@/theme/tokens"

const driftA = keyframes`
  0%, 100% { transform: rotate(-8deg) scale(1); }
  50% { transform: rotate(-4deg) scale(1.05); }
`
const driftB = keyframes`
  0%, 100% { transform: rotate(14deg) scale(1); }
  50% { transform: rotate(9deg) scale(1.06); }
`
const breathe = keyframes`
  0%, 100% { opacity: .75; }
  50% { opacity: 1; }
`

const still = { "@media (prefers-reduced-motion: reduce)": { animation: "none" } }

/** One glass-ribbon artwork. The box keeps the artwork's 3:2 shape so the fade reaches every edge. */
function Ribbon({ src, sx }: { src: string; sx: SxProps<Theme> }) {
  return (
    <Box
      sx={[
        {
          position: "absolute",
          aspectRatio: "3 / 2",
          maskImage: "radial-gradient(closest-side, black 50%, transparent 97%)",
          ...still,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Image
        src={src}
        alt=""
        fill
        loading="eager"
        sizes="(min-width: 900px) 1120px, 190vw"
        style={{ objectFit: "contain" }}
      />
    </Box>
  )
}

/**
 * The splash's full-screen backdrop: two large VETUD glass-ribbon artworks drifting slowly behind
 * everything, soft light, a faint dot grid, and darker edges where the form and footer sit so their
 * text stays easy to read. It covers the whole window and stays put while the window's content scrolls.
 */
export default function SplashBackdrop({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <Box aria-hidden sx={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      {/* Soft light. */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: [
            `radial-gradient(ellipse 50% 45% at 24% 42%, ${alpha(brand.blue, 0.5)}, transparent 70%)`,
            `radial-gradient(ellipse 40% 40% at 82% 18%, ${alpha(brand.cyan, 0.16)}, transparent 70%)`,
            `radial-gradient(ellipse 45% 35% at 70% 100%, ${alpha(brand.blue, 0.35)}, transparent 70%)`,
          ].join(", "),
          animation: `${breathe} 12s ease-in-out infinite`,
          ...still,
        }}
      />

      {/* The big ribbon sweeping up from the lower left, behind the preview. */}
      <Ribbon
        src={primary}
        sx={{
          width: { xs: "190%", md: "100%" },
          left: { xs: "-62%", md: "-36%" },
          bottom: { xs: "-8%", md: "-48%" },
          opacity: { xs: 0.45, md: 0.5 },
          animation: `${driftA} 26s ease-in-out infinite`,
        }}
      />

      {/* A second ribbon in the top right, softer, behind the headline. */}
      <Ribbon
        src={secondary}
        sx={{
          width: { xs: "150%", md: "70%" },
          right: { xs: "-70%", md: "-26%" },
          top: { xs: "-14%", md: "-42%" },
          opacity: { xs: 0.32, md: 0.4 },
          filter: "blur(1px)",
          animation: `${driftB} 32s ease-in-out infinite`,
        }}
      />

      {/* A faint dot grid, as on lab paper, fading towards the middle. */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(${alpha(brand.cyan, 0.22)} 1px, transparent 1.6px)`,
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 75% 70% at 50% 45%, transparent 35%, black 100%)",
          opacity: 0.55,
        }}
      />

      {/* Calmer behind the form (right on wide screens) and the footer, so text reads easily. */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: {
            xs: `linear-gradient(180deg, transparent 22%, ${alpha(brand.navyDeep, 0.6)} 42%, ${alpha(brand.navyDeep, 0.7)} 100%)`,
            md: [
              `linear-gradient(90deg, transparent 40%, ${alpha(brand.navyDeep, 0.62)} 58%, ${alpha(brand.navyDeep, 0.72)} 100%)`,
              `linear-gradient(180deg, transparent 70%, ${alpha(brand.navyDeep, 0.75)} 100%)`,
            ].join(", "),
          },
        }}
      />
    </Box>
  )
}
