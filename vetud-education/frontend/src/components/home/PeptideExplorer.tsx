"use client"

import { useId, useState } from "react"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { brand } from "@/theme/tokens"
import Icon from "../brand/Icon"
import { AppLink } from "../common/links"

const molecules = [
  {
    name: "Insulin", fact: "51 amino acids. An everyday essential.",
    description: "Made by the pancreas, insulin helps move glucose from the blood into cells. This familiar hormone is built from two peptide chains.",
    href: "/learn/insulin", source: "https://mrclmb.ac.uk/achievements/awards-and-prizes/nobel-prizes/1958-fred-sanger/",
  },
  {
    name: "Oxytocin", fact: "Just nine amino acids. Several important jobs.",
    description: "Oxytocin helps coordinate childbirth and milk release. Its well-established roles go far beyond the nickname ‘love hormone’.",
    href: "/learn/oxytocin", source: "https://www.ncbi.nlm.nih.gov/books/NBK279157/",
  },
  {
    name: "GLP-1", fact: "Your gut sends chemical messages.",
    description: "After food arrives, the gut releases GLP-1. This peptide helps coordinate insulin release and is part of the signalling system involved in appetite.",
    href: "/learn#weight", source: "https://www.niddk.nih.gov/news/archive/2021/story-discovery-medications-diabetes-obesity-emerged-research-pancreatic-hormone",
  },
]

// An abstract chain motif, rather than the chemical structure of a particular molecule.
const beads = Array.from({ length: 15 }, (_, i) => ({ x: 44 + i * 37, y: 130 + Math.sin(i * .57) * 70, r: 15 + (i % 3) * 3 }))

export default function PeptideExplorer() {
  const ct = useContentTranslator()
  const [selected, setSelected] = useState(0)
  const id = useId()
  const molecule = molecules[selected]

  return <Box sx={{ position: "relative", minWidth: 0, p: { xs: 2.5, sm: 3.5 }, borderRadius: "24px", bgcolor: brand.navyDeep, color: brand.onNavy, overflow: "hidden", boxShadow: "0 28px 70px -35px rgba(21,38,94,.5)", "& :focus-visible": { outline: `2px solid ${brand.cyan}`, outlineOffset: 4 } }}>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
      <Typography sx={{ fontSize: 13, color: brand.onNavyMuted }}>{ct("Meet your molecular messengers")}</Typography>
      <Icon name="molecule" sx={{ color: brand.cyan, fontSize: 24 }} />
    </Box>
    <Box component="figure" sx={{ m: 0, my: 1 }}>
      <Box component="svg" viewBox="0 0 620 270" aria-hidden="true" focusable="false" sx={{ width: "100%", display: "block", height: { xs: 170, sm: 220, lg: 245 } }}>
        <defs>
          <radialGradient id={`${id}-bead`} cx="30%" cy="25%" r="80%">
            <stop offset="0" stopColor={brand.onNavy} /><stop offset=".45" stopColor={brand.cyan} /><stop offset="1" stopColor={brand.blue} />
          </radialGradient>
        </defs>
        <ellipse cx="310" cy="145" rx="280" ry="105" fill="none" stroke={brand.cyan} opacity=".12" transform="rotate(-12 310 145)" />
        <ellipse cx="310" cy="145" rx="240" ry="80" fill="none" stroke={brand.cyan} opacity=".12" transform="rotate(18 310 145)" />
        {beads.slice(1).map((bead, i) => <line key={`bond-${i}`} x1={beads[i].x} y1={beads[i].y} x2={bead.x} y2={bead.y} stroke={brand.cyan} strokeWidth="6" opacity=".55" />)}
        {beads.map((bead, i) => <g key={i}>
          <circle cx={bead.x + 2} cy={bead.y + 6} r={bead.r + 2} fill={brand.navy} />
          <circle cx={bead.x} cy={bead.y} r={bead.r} fill={`url(#${id}-bead)`} />
        </g>)}
      </Box>
      <Typography component="figcaption" sx={{ textAlign: "center", color: brand.onNavyMuted, fontSize: 12 }}>{ct("Amino acids link together to form peptides.")}</Typography>
    </Box>
    <Box role="group" aria-label={ct("Choose a peptide to explore")} sx={{ display: "flex", gap: 1, mt: 3, mb: 2.5, flexWrap: "wrap" }}>
      {molecules.map((item, index) => <Button key={item.name} aria-pressed={selected === index} aria-controls={`${id}-detail`} onClick={() => setSelected(index)} sx={{ minHeight: 44, px: 2, py: 1, flex: 1, borderRadius: "24px", border: "1px solid", borderColor: selected === index ? brand.cyan : brand.navySoft, bgcolor: selected === index ? brand.cyan : "transparent", color: selected === index ? brand.navyDeep : brand.onNavy, "&:hover": { bgcolor: selected === index ? brand.tealBright : brand.navy, transform: "none" } }}>{ct(item.name)}</Button>)}
    </Box>
    <Box id={`${id}-detail`} aria-live="polite" aria-atomic="true" sx={{ minHeight: { xs: 185, sm: 160 } }}>
      <Typography component="h2" sx={{ fontSize: { xs: 23, md: 26 }, fontWeight: 500, lineHeight: 1.25, letterSpacing: "-.035em" }}>{ct(molecule.fact)}</Typography>
      <Typography sx={{ mt: 1.25, fontSize: 14, color: brand.onNavyMuted, lineHeight: 1.75 }}>{ct(molecule.description)}</Typography>
    </Box>
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center", flexWrap: "wrap", borderTop: "1px solid", borderColor: brand.navySoft, pt: 1.5 }}>
      <AppLink href={molecule.href} sx={{ minHeight: 44, display: "inline-flex", alignItems: "center", gap: 1, color: brand.onNavy, fontSize: 14, fontWeight: 600 }}>{ct("Explore the guide")}<Icon name="arrowRight" sx={{ fontSize: 18 }} /></AppLink>
      <Box component="a" href={molecule.source} target="_blank" rel="noopener noreferrer" sx={{ minHeight: 44, display: "inline-flex", alignItems: "center", color: brand.onNavyMuted, fontSize: 12, textUnderlineOffset: 4 }}>{ct("Read the source")}</Box>
    </Box>
  </Box>
}
