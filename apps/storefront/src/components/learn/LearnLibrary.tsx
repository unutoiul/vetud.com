"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"

import { translateAction } from "@/i18n/actions"
import { useTranslations } from "next-intl"


import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { useSyncExternalStore } from "react"
import { CATEGORIES, type CategoryId } from "@/content/learn/categories"
import { PEPTIDES } from "@/content/learn/peptides"
import PeptideCard from "./PeptideCard"

const isCategory = (value: string): value is CategoryId => CATEGORIES.some((category) => category.id === value)

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange)
  return () => window.removeEventListener("hashchange", onChange)
}

function readHash(): CategoryId | null {
  const hash = window.location.hash.slice(1)
  return isCategory(hash) ? hash : null
}

/**
 * The peptide library with a one-pick category list. The choice lives in the URL hash
 * (/learn#weight), so topic links from other pages land on the right shelf.
 */
export default function LearnLibrary({ shop = {} }: { shop?: Record<string, string> }) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const active = useSyncExternalStore(subscribe, readHash, () => null)

  const choose = (id: CategoryId | null) => {
    // replaceState keeps the scroll position; the manual event tells the store to re-read.
    window.history.replaceState(null, "", id ? `#${id}` : window.location.pathname + window.location.search)
    window.dispatchEvent(new HashChangeEvent("hashchange"))
  }

  // "View all" follows the topic order, so related peptides sit together.
  const ordered = [...PEPTIDES].sort((a, b) => CATEGORIES.findIndex((category) => category.id === a.category) - CATEGORIES.findIndex((category) => category.id === b.category))
  const shown = active ? ordered.filter((peptide) => peptide.category === active) : ordered
  const options: { id: CategoryId | null; name: string; count: number }[] = [
    { id: null, name: "View all", count: PEPTIDES.length },
    ...CATEGORIES.map((category) => ({ id: category.id, name: category.name, count: PEPTIDES.filter((peptide) => peptide.category === category.id).length })).filter((option) => option.count),
  ]

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "300px minmax(0, 1fr)" }, gap: { xs: 3, lg: 5 }, alignItems: "start" }}>
      <Box component="nav" aria-label={act("topics")} sx={{ minWidth: 0, position: { lg: "sticky" }, top: { lg: 112 }, bgcolor: "brand.mintWash", border: "1px solid", borderColor: "divider", borderRadius: "16px", p: { xs: 2, md: 2.5 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", px: 1, mb: 1.5 }}>
          <Typography component="h2" sx={{ fontSize: 19, fontWeight: 700, letterSpacing: "-.02em" }}>{ct("Topic")}</Typography>
          <Typography sx={{ fontSize: 13.5, color: "text.secondary" }}>{ct.rich("{v0} guides", { v0: ct(PEPTIDES.length) }, {  })}</Typography>
        </Box>
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: { xs: "flex", lg: "grid" }, gap: { xs: 1, lg: .5 }, overflowX: { xs: "auto", lg: "visible" }, pb: { xs: .5, lg: 0 }, scrollbarWidth: "thin" }}>
          {options.map((option) => {
            const selected = option.id === active
            return (
              <Box component="li" key={option.id ?? "all"} sx={{ flexShrink: 0 }}>
                <Box component="button" type="button" onClick={() => choose(option.id)} aria-pressed={selected} sx={{ width: "100%", minHeight: 46, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, px: 1.75, border: 0, borderRadius: "10px", font: "inherit", fontSize: 15, fontWeight: 600, textAlign: "left", whiteSpace: "nowrap", cursor: "pointer", bgcolor: selected ? "brand.navy" : "transparent", color: selected ? "#fff" : "text.primary", transition: "background-color .15s ease", "&:hover": { bgcolor: selected ? "brand.navy" : "rgba(21,38,94,.06)" }, "&:focus-visible": { outline: "2px solid", outlineColor: "brand.blue", outlineOffset: 2 } }}>
                  {translateAction(act, option.name)}
                  <Box component="span" sx={{ minWidth: 30, px: .75, py: .25, borderRadius: "6px", textAlign: "center", fontSize: 13, fontVariantNumeric: "tabular-nums", bgcolor: selected ? "rgba(255,255,255,.16)" : "#fff", color: selected ? "#fff" : "text.secondary" }}>{ct(option.count)}</Box>
                </Box>
              </Box>
            )
          })}
        </Box>
        <Typography sx={{ display: { xs: "none", lg: "block" }, mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider", px: 1, fontSize: 13, color: "text.secondary", lineHeight: 1.6 }}>
          {ct("Topics make browsing easier. Every page shows how far the research has really got.")}
        </Typography>
        {active ? <Box component="button" type="button" onClick={() => choose(null)} sx={{ display: { xs: "none", lg: "inline-block" }, mt: 1.5, ml: 1, p: 0, border: 0, bgcolor: "transparent", font: "inherit", fontSize: 14, fontWeight: 600, color: "brand.blue", textDecoration: "underline", cursor: "pointer", minHeight: 32 }}>{act("clearFilters")}</Box> : null}
      </Box>

      <Box>
        <Typography aria-live="polite" sx={{ fontSize: 14, color: "text.secondary", mb: 2.5 }}>
          {active ? `${CATEGORIES.find((category) => category.id === active)?.name}: ${shown.length} ${shown.length === 1 ? "guide" : "guides"}` : `All ${shown.length} guides`}
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", xl: "repeat(3, 1fr)" }, gap: 2.5 }}>
          {shown.map((peptide) => <PeptideCard key={peptide.slug} peptide={peptide} shopHref={shop[peptide.slug]} />)}
        </Box>
      </Box>
    </Box>
  )
}
