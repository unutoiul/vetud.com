import Box from "@mui/material/Box"
import Image from "next/image"

/** Supplied VETUD Peptide Series logo, framed for the shop header and footer. */
export function LogoMark({ size = 44, tone = "dark" }: { size?: number; tone?: "dark" | "light" }) {
  return (
    <Image
      src="/brand/vetud-mark.svg"
      width={size}
      height={(size * 76) / 88}
      alt=""
      style={{ flexShrink: 0, display: "block", filter: tone === "light" ? "brightness(0) invert(1)" : undefined }}
    />
  )
}

/**
 * The logo file already holds the symbol and the VETUD Peptide Series wordmark. Nothing is added
 * under it: a "Science Lab" caption there read as a second logo (owner report 2026-11-18), and
 * Science Lab is the education site's name.
 */
export default function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <Box
      component="span"
      translate="no"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        width: { xs: "clamp(164px, calc(100vw - 156px), 190px)", sm: 210, md: 230 },
        maxWidth: "100%",
        lineHeight: 0,
      }}
    >
      <Image
        src={tone === "light" ? "/brand/vetud-logo-white.svg" : "/brand/vetud-logo.svg"}
        alt="VETUD Peptide Series"
        width={362}
        height={76}
        priority
        style={{ display: "block", width: "100%", height: "auto" }}
      />
    </Box>
  )
}
