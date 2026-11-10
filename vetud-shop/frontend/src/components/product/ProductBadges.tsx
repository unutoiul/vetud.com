"use client"

import Box from "@mui/material/Box"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { productMerchandising } from "@/lib/product-merchandising"

/** Independent, wrapping labels shared by the carousel, catalog and product detail. */
export default function ProductBadges({ metadata }: { metadata?: Record<string, unknown> | null }) {
  const ct = useContentTranslator()
  const { veryPopular, bestSeller } = productMerchandising({ metadata })
  if (!veryPopular && !bestSeller) return null
  const badge = { display: "inline-flex", alignItems: "center", borderRadius: "99px", px: 1.25, py: .5, fontSize: 11, fontWeight: 700, lineHeight: 1.4 } as const
  return <Box sx={{ display: "flex", flexWrap: "wrap", gap: .75, mb: 1.25 }}>
    {veryPopular ? <Box component="span" sx={{ ...badge, color: "brand.navy", bgcolor: "brand.mint" }}>{ct("Very popular")}</Box> : null}
    {bestSeller ? <Box component="span" sx={{ ...badge, color: "#fff", bgcolor: "brand.navy" }}>{ct("Best seller")}</Box> : null}
  </Box>
}
