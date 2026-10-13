"use client"

import Box from "@mui/material/Box"
import Icon from "../brand/Icon"
import { formatMoney } from "@/lib/product"
import { useStore } from "../store/StoreProvider"

export default function AnnouncementBar() {
  const { region } = useStore()
  return <Box sx={{ minHeight: 34, px: 2, py: .75, display: "flex", alignItems: "center", justifyContent: "center", gap: 1, color: "brand.navySoft", bgcolor: "#e9f0f4", fontSize: { xs: 10.5, sm: 11.5 }, textAlign: "center" }}>
    <Icon name="truck" sx={{ fontSize: 15 }} />
    {region.freeShippingThreshold ? `Complimentary standard shipping over ${formatMoney(region.freeShippingThreshold, region.currencyCode, { whole: true })}` : "Research materials, delivered across the US and Europe"}
    <Box component="span" sx={{ display: { xs: "none", sm: "inline" }, ml: 1.5, pl: 2.5, borderLeft: "1px solid #c5d5df" }}>Lot documentation with every collection</Box>
  </Box>
}
