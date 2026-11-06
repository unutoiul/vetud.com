"use client"

import { useTranslations } from "next-intl"
import { translateAction } from "@/i18n/actions"

import Box from "@mui/material/Box"
import Link from "@mui/material/Link"
import Typography from "@mui/material/Typography"
import { useEffect, useState } from "react"

export type ContentsItem = { id: string; label: string }

export default function TableOfContents({ items }: { items: ContentsItem[] }) {
  const act = useTranslations("Actions")
  const [active, setActive] = useState(items[0]?.id)
  useEffect(() => {
    const sections = items.flatMap(item => { const element = document.getElementById(item.id); return element ? [element] : [] })
    const observer = new IntersectionObserver(() => {
      const current = sections.filter(section => section.getBoundingClientRect().top <= 180).at(-1)
      if (current) setActive(current.id)
    }, { rootMargin: "-125px 0px -60% 0px", threshold: 0 })
    sections.forEach(section => observer.observe(section))
    return () => observer.disconnect()
  }, [items])

  const links = <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0 }}>
    {items.map(item => <li key={item.id}>
      <Link href={`#${item.id}`} aria-current={active === item.id ? "location" : undefined} onClick={event => {
        setActive(item.id)
        const details = event.currentTarget.closest("details")
        if (details) details.open = false
      }} sx={{ display: "flex", alignItems: "center", minHeight: 44, py: 1, pl: 2, borderLeft: "2px solid", borderColor: active === item.id ? "brand.blue" : "divider", color: active === item.id ? "brand.navy" : "brand.navySoft", fontWeight: active === item.id ? 700 : 500, fontSize: 14, lineHeight: 1.5, textDecoration: "none", "&:hover": { color: "brand.blue", textDecoration: "underline" } }}>{translateAction(act, item.label)}</Link>
    </li>)}
  </Box>

  return <Box component="aside" sx={{ minWidth: 0, alignSelf: "start", position: { lg: "sticky" }, top: 120 }}>
    <Box component="nav" aria-label={act("onThisPage")} sx={{ display: { xs: "none", lg: "block" }, maxHeight: "calc(100dvh - 150px)", overflowY: "auto", pr: 1 }}>
      <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 2, color: "brand.navy" }}>{act("onThisPage")}</Typography>
      {links}
    </Box>
    <Box component="details" sx={{ display: { lg: "none" }, border: "1px solid", borderColor: "divider", borderRadius: "8px", px: 2, bgcolor: "brand.paper", "& summary": { minHeight: 52, display: "list-item", alignContent: "center", cursor: "pointer", fontSize: 15, fontWeight: 650, color: "brand.navy" }, "&[open]": { pb: 2 } }}>
      <summary>{act("onThisPage")}</summary>
      <nav aria-label={act("articleSections")}>{links}</nav>
    </Box>
  </Box>
}
