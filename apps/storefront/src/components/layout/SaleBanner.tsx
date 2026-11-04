"use client"

import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { useLocale, useTranslations } from "next-intl"
import type { LiveSale } from "@/lib/medusa/sale"
import { gutter } from "@/theme/tokens"
import Icon from "../brand/Icon"
import { LocalizedNextLink } from "../common/links"

/** The thin bar above the header while a sale runs: "Winter offer: 20% off everything. Take advantage →". */
export default function SaleBanner({ sale }: { sale: LiveSale }) {
  const t = useTranslations("Offer")
  const locale = useLocale()
  const ends = sale.ends_at ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(new Date(sale.ends_at)) : null
  return (
    <Box component="aside" aria-label={sale.title} sx={{ bgcolor: "brand.navy", color: "#fff", px: gutter, py: 1 }}>
      <Box
        component={LocalizedNextLink}
        href="/shop"
        sx={{ maxWidth: 1360, mx: "auto", minHeight: 28, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", columnGap: 1.25, rowGap: 0.25, color: "inherit", textDecoration: "none", textAlign: "center", "&:hover .sale-cta, &:focus-visible .sale-cta": { textDecoration: "underline" }, "&:focus-visible": { outline: "2px solid #fff", outlineOffset: 2 } }}
      >
        <Typography component="span" sx={{ fontSize: 13.5, fontWeight: 700 }}>
          {t("bannerSale", { title: sale.title, percent: sale.percent_off })}
        </Typography>
        {ends ? <Typography component="span" sx={{ fontSize: 13, color: "brand.onNavyMuted" }}>{t("bannerEnds", { date: ends })}</Typography> : null}
        <Typography component="span" className="sale-cta" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontSize: 13.5, fontWeight: 600, color: "brand.cyan" }}>
          {t("bannerCta")}<Icon name="arrowRight" sx={{ fontSize: 16 }} />
        </Typography>
      </Box>
    </Box>
  )
}
