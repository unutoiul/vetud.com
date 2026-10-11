"use client"

import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined"
import Box from "@mui/material/Box"
import LinearProgress from "@mui/material/LinearProgress"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { FREE_SHIPPING_THRESHOLD } from "@/lib/config"
import { formatMoney } from "@/lib/product"

export default function FreeShippingProgress({
  itemTotal,
  currencyCode,
}: {
  itemTotal: number
  currencyCode: string
}) {
  const threshold = FREE_SHIPPING_THRESHOLD[currencyCode]
  if (!threshold) {
    return null
  }
  const remaining = Math.max(0, threshold - itemTotal)
  const progress = Math.min(100, (itemTotal / threshold) * 100)

  return (
    <Box sx={{ bgcolor: "brand.mintWash", border: "1px solid", borderColor: "brand.line", borderRadius: 1, p: 1.75 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
        <LocalShippingOutlinedIcon fontSize="small" sx={{ color: "secondary.main" }} />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {remaining > 0
            ? `${formatMoney(remaining, currencyCode)} away from free standard shipping`
            : "Your order ships free (standard)"}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={progress}
        color="secondary"
        aria-label="Progress towards free shipping"
        sx={{ height: 6, borderRadius: 3, bgcolor: "brand.line" }}
      />
    </Box>
  )
}
