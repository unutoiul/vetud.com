import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import { getCategory } from "@/content/learn/categories"
import type { PeptideProfile } from "@/content/learn/peptides"
import Icon from "../brand/Icon"
import { AppLink } from "../common/links"
import ArticleArt from "./ArticleArt"
import StatusBadge from "./StatusBadge"

/**
 * A library entry: the molecule drawing, what it is in one line, and how far it has got.
 * No prices; `shopHref` adds a link to the product when the shop carries it.
 */
export default function PeptideCard({ peptide, shopHref }: { peptide: PeptideProfile; shopHref?: string }) {
  const category = getCategory(peptide.category)
  return (
    <Box component="article" sx={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", border: "1px solid", borderColor: "divider", borderRadius: "8px", bgcolor: "#fff", overflow: "hidden", transition: "border-color .2s ease, box-shadow .2s ease", "&:hover": { borderColor: "brand.lineStrong", boxShadow: "0 12px 30px rgba(21,38,94,.07)" }, "&:focus-within": { outline: "2px solid", outlineColor: "brand.blue", outlineOffset: 3 } }}>
      <Box sx={{ position: "relative", height: 150, bgcolor: "#fff", borderBottom: "1px solid", borderColor: "divider" }}>
        {peptide.pubchem
          ? <Image src={`/images/learn/structures/${peptide.slug}.webp`} alt={`Chemical structure of ${peptide.name}`} fill sizes="(max-width: 600px) 90vw, 320px" style={{ objectFit: "contain", padding: 12 }} loading="lazy" />
          : <ArticleArt variant="triple" uid={`peptide-${peptide.slug}`} sx={{ position: "absolute", inset: 0 }} />}
      </Box>
      <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", flex: 1 }}>
        <Typography sx={{ fontSize: 12, color: "text.secondary", display: "flex", alignItems: "center", gap: .75 }}>
          <Icon name={category.icon} sx={{ fontSize: 16, color: "brand.blue" }} />{category.name}
        </Typography>
        <Typography component="h3" sx={{ mt: 1, fontSize: 21, fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25 }}>
          <AppLink href={`/learn/${peptide.slug}`} underline="none" sx={{ color: "text.primary", fontWeight: "inherit", "&::after": { content: '""', position: "absolute", inset: 0 }, "&:focus-visible": { outline: "none" } }}>
            {peptide.name}
          </AppLink>
        </Typography>
        {peptide.aka ? <Typography sx={{ fontSize: 12.5, color: "text.secondary", mt: .25 }}>{peptide.aka}</Typography> : null}
        <Typography sx={{ mt: 1.25, fontSize: 14, lineHeight: 1.65, color: "text.secondary", flex: 1 }}>{peptide.oneLiner}</Typography>
        <Box sx={{ mt: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <StatusBadge status={peptide.status} size="small" />
          {shopHref
            // Sits above the card-wide profile link, so it opens the product instead.
            ? <AppLink href={shopHref} aria-label={`${peptide.name} in the research shop`} sx={{ position: "relative", zIndex: 1, minHeight: 32, display: "inline-flex", alignItems: "center", gap: .5, fontSize: 13, fontWeight: 650 }}>In the shop<Icon name="arrowUpRight" aria-hidden sx={{ fontSize: 16 }} /></AppLink>
            : <Icon name="arrowUpRight" aria-hidden sx={{ fontSize: 18, color: "brand.navy" }} />}
        </Box>
      </Box>
    </Box>
  )
}
