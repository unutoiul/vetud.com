import Box from "@mui/material/Box"
import Image from "next/image"

/** VETUD symbol and education wordmark used throughout the website. */
export function LogoMark({ size = 44, tone = "dark" }: { size?: number; tone?: "dark" | "light" }) {
  return <Image src="/brand/vetud-mark.svg" width={size} height={size * 76 / 88} alt="" style={{ flexShrink: 0, display: "block", filter: tone === "light" ? "brightness(0) invert(1)" : undefined }} />
}

export default function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return <Box component="span" translate="no" sx={{ display: "inline-flex", alignItems: "center", width: { xs: "clamp(164px, calc(100vw - 156px), 190px)", sm: 210, md: 230 }, maxWidth: "100%", lineHeight: 0 }}>
    <Image src={tone === "light" ? "/brand/vetud-logo-white.svg" : "/brand/vetud-logo.svg"} alt="VETUD Peptides Education" width={362} height={76} priority style={{ width: "100%", height: "auto" }} />
  </Box>
}
