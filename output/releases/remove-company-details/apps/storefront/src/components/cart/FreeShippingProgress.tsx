"use client"

import { TruckIcon as LocalShippingOutlinedIcon } from "@/components/brand/Icon"
import Box from "@mui/material/Box"
import LinearProgress from "@mui/material/LinearProgress"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useLocale } from "next-intl"
import { formatMoney } from "@/lib/product"
import { useStore } from "../store/StoreProvider"

export default function FreeShippingProgress({
  itemTotal,
  currencyCode,
}: {
  itemTotal: number
  currencyCode: string
}) {
  const locale = useLocale()
  const { region } = useStore()
  // The threshold belongs to the visitor's region; the cart is always in that region's currency.
  const threshold = region.currencyCode === currencyCode ? region.freeShippingThreshold : undefined
  if (!threshold) {
    return null
  }
  const remaining = Math.max(0, threshold - itemTotal)
  const progress = Math.min(100, (itemTotal / threshold) * 100)

  return (
    <Box sx={{ bgcolor: "brand.mintWash", border: "1px solid", borderColor: "brand.line", borderRadius: 2.5, p: 1.75 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
        <LocalShippingOutlinedIcon fontSize="small" sx={{ color: "secondary.main" }} />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {remaining > 0
            ? `${formatMoney(remaining, currencyCode, { locale })} away from free standard shipping`
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
