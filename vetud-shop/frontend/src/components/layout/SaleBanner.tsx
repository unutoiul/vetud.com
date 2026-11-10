"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"


import Box from "@mui/material/Box"
import { keyframes } from "@mui/material/styles"
import { useLocale, useTranslations } from "next-intl"
import { useSyncExternalStore } from "react"
import type { LiveSale } from "@/lib/medusa/sale"
import { brand, fonts, gutter } from "@/theme/tokens"
import Icon from "../brand/Icon"
import { LocalizedNextLink } from "../common/links"

const TICK_MS = 30_000

// The clock only runs in the browser: the server render (and hydration) shows the end date alone.
const subscribe = (onTick: () => void) => {
  const timer = window.setInterval(onTick, TICK_MS)
  return () => window.clearInterval(timer)
}
const clientNow = () => Math.floor(Date.now() / TICK_MS) * TICK_MS
const serverNow = () => null

/** A light sweep across the button every few seconds; off for visitors who prefer reduced motion. */
const sheen = keyframes`
  0%, 72% { transform: translateX(-140%) skewX(-18deg); }
  100% { transform: translateX(260%) skewX(-18deg); }
`

const glacier = "rgba(143, 198, 221, "

const visuallyHidden = { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" } as const

/** A faint alpine ridge at each end of the bar, like the brand artwork. */
function Ridge({ side }: { side: "left" | "right" }) {
  return (
    <Box
      component="svg"
      aria-hidden
      viewBox="0 0 260 48"
      preserveAspectRatio="none"
      sx={{
        position: "absolute", bottom: 0, [side]: 0, width: 300, height: "100%", pointerEvents: "none",
        display: { xs: "none", md: "block" }, opacity: 0.32, transform: side === "right" ? "scaleX(-1)" : undefined,
        maskImage: "linear-gradient(90deg, #000 30%, transparent)",
      }}
    >
      <path d="M0 40 L26 27 L42 33 L70 12 L94 29 L112 22 L140 37 L164 25 L192 39 L220 31 L260 46" fill="none" stroke={brand.cyan} strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
      <path d="M0 48 L24 39 L50 43 L80 26 L108 40 L132 33 L160 44 L186 37 L214 46 L260 48" fill="none" stroke={brand.cyan} strokeWidth="1" strokeOpacity="0.55" vectorEffect="non-scaling-stroke" />
    </Box>
  )
}

/**
 * The bar above the header while a sale runs: the sale's name, the deal, a live countdown to its
 * end and a "Shop the sale" button. The whole bar is one link to the shop. It disappears on its own
 * when the countdown reaches zero, before the server stops sending the sale.
 */
export default function SaleBanner({ sale, endLabel }: { sale: LiveSale; endLabel: string | null }) {
  const ct = useContentTranslator()
  const t = useTranslations("Offer")
  const locale = useLocale()
  const now = useSyncExternalStore(subscribe, clientNow, serverNow)
  const endsAt = sale.ends_at ? new Date(sale.ends_at) : null
  const left = endsAt && now !== null ? endsAt.getTime() - now : null
  if (left !== null && left <= 0) return null

  // Keep the initial label identical when browser and server ICU language data differ.
  const ends = endLabel
  // "27d 5h 59m" in the page's language (de: "27 T. 5 Std. 59 Min."); minutes only in the last days.
  const unit = (value: number, name: "day" | "hour" | "minute") => new Intl.NumberFormat(locale, { style: "unit", unit: name, unitDisplay: "narrow" }).format(value)
  const days = left !== null ? Math.floor(left / 86_400_000) : 0
  const hours = left !== null ? Math.floor(left / 3_600_000) % 24 : 0
  const minutes = left !== null ? Math.floor(left / 60_000) % 60 : 0
  const countdown = left === null ? null : [days ? unit(days, "day") : null, unit(hours, "hour"), days < 3 ? unit(minutes, "minute") : null].filter(Boolean).join(" ")

  return (
    <Box
      component="aside"
      aria-label={t("bannerSale", { title: sale.title, percent: sale.percent_off })}
      sx={{
        position: "relative", overflow: "hidden", color: "brand.onNavy",
        background: `radial-gradient(55% 160% at 50% 0%, ${glacier}0.2), transparent 70%), linear-gradient(90deg, ${brand.navyDeep}, ${brand.navy} 50%, ${brand.navyDeep})`,
        borderBottom: `1px solid ${glacier}0.18)`,
      }}
    >
      <Ridge side="left" />
      <Ridge side="right" />
      <Box
        component={LocalizedNextLink}
        href="/shop"
        sx={{
          position: "relative", maxWidth: 1360, mx: "auto", minHeight: 44, px: gutter, py: 0.75,
          display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", columnGap: { xs: 1.25, md: 2.25 }, rowGap: 0.5,
          color: "inherit", textDecoration: "none", textAlign: "center",
          "&:focus-visible": { outline: "2px solid #fff", outlineOffset: -3, borderRadius: "4px" },
          "&:hover .sale-arrow, &:focus-visible .sale-arrow": { transform: "translateX(3px)" },
          "&:hover .sale-cta": { bgcolor: "#fff" },
        }}
      >
        <Box component="span" sx={{ fontFamily: fonts.mono, fontSize: 10.5, fontWeight: 500, letterSpacing: ".14em", textTransform: "uppercase", color: "brand.cyan", lineHeight: 1, px: 1, py: 0.6, borderRadius: 999, border: `1px solid ${glacier}0.45)`, bgcolor: `${glacier}0.1)`, whiteSpace: "nowrap" }}>
          {ct(sale.title)}
        </Box>

        <Box component="span" sx={{ fontSize: { xs: 13.5, sm: 14 }, fontWeight: 600, letterSpacing: "-.005em" }}>
          {t.rich("bannerDeal", {
            percent: sale.percent_off,
            b: (chunks) => (
              <Box component="strong" sx={{ fontSize: { xs: 15, sm: 16 }, fontWeight: 800, color: "#fff", fontVariantNumeric: "tabular-nums", pb: "1px", background: `linear-gradient(transparent 84%, ${brand.cyan} 84%, ${brand.cyan} 96%, transparent 96%)` }}>
                {ct(chunks)}
              </Box>
            ),
          })}
        </Box>

        {/* Phones have no room for the countdown; screen readers still hear the end date. */}
        {ends ? <Box component="span" sx={{ ...visuallyHidden, display: { sm: "none" } }}>{t("bannerEnds", { date: ends })}</Box> : null}
        {ends ? (
          <Box component="span" sx={{ display: { xs: "none", sm: "inline-flex" }, alignItems: "center", gap: 0.75, pl: { sm: 2.25 }, borderLeft: `1px solid ${glacier}0.28)`, fontSize: 12.5, color: "brand.onNavyMuted", whiteSpace: "nowrap" }}>
            <Icon name="clock" sx={{ fontSize: 15, color: "brand.cyan" }} />
            {countdown ? (
              <>
                {t("endsIn")}
                {/* The brand sans, not the mono: unit letters are Greek or Cyrillic on some pages. */}
                <Box component="span" sx={{ fontSize: 13, fontWeight: 700, color: "brand.onNavy", fontVariantNumeric: "tabular-nums" }}>{ct(countdown)}</Box>
                <Box component="span" sx={{ display: { sm: "none", lg: "inline" } }}>· {ct(ends)}</Box>
              </>
            ) : t("bannerEnds", { date: ends })}
          </Box>
        ) : null}

        <Box
          component="span"
          className="sale-cta"
          sx={{
            position: "relative", overflow: "hidden", display: { xs: "none", md: "inline-flex" }, alignItems: "center", gap: 0.5,
            px: 1.75, py: 0.6, borderRadius: 999, bgcolor: "brand.onNavy", color: "brand.navy", fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap",
            boxShadow: `0 0 0 3px ${glacier}0.16)`, transition: "background-color .2s ease",
            "&::after": {
              content: '""', position: "absolute", inset: 0, width: "40%",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,.75), transparent)",
              animation: `${sheen} 6s ease-in-out 1.5s infinite`,
              "@media (prefers-reduced-motion: reduce)": { animation: "none", display: "none" },
            },
          }}
        >
          {t("bannerCta")}
          <Icon name="arrowRight" className="sale-arrow" sx={{ fontSize: 15, transition: "transform .2s ease" }} />
        </Box>
        <Icon name="arrowRight" className="sale-arrow" sx={{ display: { xs: "inline-block", md: "none" }, fontSize: 16, color: "brand.cyan", transition: "transform .2s ease" }} />
      </Box>
    </Box>
  )
}
