import Box from "@mui/material/Box"
import Image from "next/image"

/** VETUD symbol and Science Lab wordmark used throughout the education website. */
export function LogoMark({ size = 44, tone = "dark" }: { size?: number; tone?: "dark" | "light" }) {
  return <Image src="/brand/vetud-mark.svg" width={size} height={size * 76 / 88} alt="" style={{ flexShrink: 0, display: "block", filter: tone === "light" ? "brightness(0) invert(1)" : undefined }} />
}

export default function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return <Box component="span" translate="no" sx={{ display: "inline-flex", alignItems: "center", flexShrink: 0, width: { xs: 112, sm: 124, md: 136 }, maxWidth: "100%", lineHeight: 0 }}>
    <Image src={tone === "light" ? "/brand/vetud-science-lab-logo-white.png" : "/brand/vetud-science-lab-logo.png"} alt="VETUD Science Lab" width={1536} height={1024} sizes="(min-width: 900px) 136px, (min-width: 600px) 124px, 112px" preload style={{ display: "block", width: "100%", height: "auto" }} />
  </Box>
}
