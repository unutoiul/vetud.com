"use client"

import Box from "@mui/material/Box"
import { formatMoney } from "@/lib/product"
import { useStore } from "../store/StoreProvider"

export default function AnnouncementBar() {
  const { region } = useStore()
  const threshold = region.freeShippingThreshold

  return (
    <Box
      sx={{
        bgcolor: "brand.navy",
        color: "#d2eeea",
        minHeight: 36,
        px: 2,
        py: 0.75,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        fontSize: { xs: 11, sm: 12 },
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}
    >
      <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
        Lot-documented research materials
        <Box component="span" aria-hidden sx={{ color: "brand.tealBright", mx: 1 }}>
          •
        </Box>
      </Box>
      {threshold
        ? `Free standard shipping over ${formatMoney(threshold, region.currencyCode, { whole: true })}`
        : "Shipping to the US and Europe"}
    </Box>
  )
}
