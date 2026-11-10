"use client"

import Box from "@mui/material/Box"
import { useTranslations } from "next-intl"
import Icon from "@/components/brand/Icon"

/** A readable stock label shared by product listings and the selected product amount. */
export default function StockBadge({ inStock }: { inStock: boolean }) {
  const t = useTranslations("Common")

  return <Box
    component="span"
    data-stock-status={inStock ? "available" : "sold-out"}
    sx={{
      display: "inline-flex",
      alignItems: "center",
      gap: .75,
      flexShrink: 0,
      minHeight: 34,
      px: 1.25,
      py: .5,
      boxSizing: "border-box",
      borderRadius: "5px",
      bgcolor: inStock ? "success.main" : "error.main",
      color: inStock ? "success.contrastText" : "error.contrastText",
      fontSize: 13,
      fontWeight: 700,
      lineHeight: 1.4,
      whiteSpace: "nowrap",
    }}
  >
    <Icon name={inStock ? "checkCircle" : "close"} sx={{ fontSize: 17 }} />
    {t(inStock ? "available" : "soldOut")}
  </Box>
}
