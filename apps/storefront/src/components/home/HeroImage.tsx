import Box from "@mui/material/Box"
import Image from "next/image"

/** A single, product-free scene for the home hero. */
export default function HeroImage() {
  return (
    <Box sx={{ position: "relative", aspectRatio: { xs: "4 / 3", md: "5 / 4" }, borderRadius: 4, overflow: "hidden", boxShadow: "0 24px 60px rgba(31,63,82,.14)" }}>
      <Image
        src="/images/vetud-glacial-detail.png"
        alt="Snow-capped mountains above a clear glacial lake"
        fill
        priority
        sizes="(min-width: 900px) 55vw, 100vw"
        style={{ objectFit: "cover" }}
      />
    </Box>
  )
}
