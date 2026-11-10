"use client"

import Box from "@mui/material/Box"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { productMerchandising } from "@/lib/product-merchandising"
import { productBadgeColors } from "@/theme/tokens"

/** Independent, wrapping labels shared by the carousel, catalog and product detail. */
export default function ProductBadges({ metadata }: { metadata?: Record<string, unknown> | null }) {
  const ct = useContentTranslator()
  const { veryPopular, bestSeller } = productMerchandising({ metadata })
  if (!veryPopular && !bestSeller) return null
  const badge = { display: "inline-flex", alignItems: "center", border: "1px solid", borderRadius: "99px", px: 1.25, py: .5, fontSize: 12, fontWeight: 700, lineHeight: 1.4, whiteSpace: "nowrap" } as const
  return <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1.25 }}>
    {veryPopular ? <Box component="span" sx={{ ...badge, color: productBadgeColors.popular.foreground, bgcolor: productBadgeColors.popular.background, borderColor: productBadgeColors.popular.border }}>{ct("Very popular")}</Box> : null}
    {bestSeller ? <Box component="span" sx={{ ...badge, color: productBadgeColors.bestSeller.foreground, bgcolor: productBadgeColors.bestSeller.background, borderColor: productBadgeColors.bestSeller.border }}>{ct("Best seller")}</Box> : null}
  </Box>
}
