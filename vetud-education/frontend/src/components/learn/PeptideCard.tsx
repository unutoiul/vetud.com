import { useContentTranslator } from "@/i18n/use-content-translator"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import { getCategory } from "@/content/learn/categories"
import { getLearnIllustration } from "@/content/learn/illustrations"
import type { PeptideProfile } from "@/content/learn/peptides"
import type { PlannedPeptide } from "@/content/learn/planned-peptides"
import Icon from "../brand/Icon"
import { AppLink } from "../common/links"
import ArticleArt from "./ArticleArt"
import StatusBadge from "./StatusBadge"

/**
 * A library entry: the molecule drawing, what it is in one line, and how far it has got.
 * A planned peptide (no guide yet) shows "Coming soon" instead.
 */
export default function PeptideCard({ peptide }: { peptide: PeptideProfile | PlannedPeptide }) {
  const ct = useContentTranslator()
  const category = getCategory(peptide.category)
  const profile = "status" in peptide ? peptide : null
  const illustration = profile ? getLearnIllustration(peptide.slug) : undefined
  return (
    <Box component="article" sx={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", border: "1px solid", borderColor: "divider", borderRadius: "8px", bgcolor: "#fff", overflow: "hidden", transition: "border-color .2s ease, box-shadow .2s ease", "&:hover": { borderColor: "brand.lineStrong", boxShadow: "0 12px 30px rgba(21,38,94,.07)" }, "&:focus-within": { outline: "2px solid", outlineColor: "brand.blue", outlineOffset: 3 } }}>
      <Box sx={{ position: "relative", height: 150, bgcolor: "#fff", borderBottom: "1px solid", borderColor: "divider" }}>
        {illustration
          ? <Image src={illustration.src} alt={ct(illustration.alt)} fill sizes="(max-width: 600px) 90vw, 420px" style={{ objectFit: "cover" }} />
          : profile?.pubchem
          ? <Image src={`/images/learn/structures/${peptide.slug}.webp`} alt={ct.template("Chemical structure of {v0}", { v0: peptide.name })} fill sizes="(max-width: 600px) 90vw, 320px" style={{ objectFit: "contain", padding: 12 }} loading="lazy" />
          : <ArticleArt variant="triple" uid={`peptide-${peptide.slug}`} sx={{ position: "absolute", inset: 0 }} />}
      </Box>
      <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", flex: 1 }}>
        <Typography sx={{ fontSize: 12, color: "text.secondary", display: "flex", alignItems: "center", gap: .75 }}>
          <Icon name={category.icon} sx={{ fontSize: 16, color: "brand.blue" }} />{ct(category.name)}
        </Typography>
        <Typography component="h3" sx={{ mt: 1, fontSize: 21, fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.25 }}>
          <AppLink href={`/learn/${peptide.slug}`} underline="none" sx={{ color: "text.primary", fontWeight: "inherit", "&::after": { content: '""', position: "absolute", inset: 0 }, "&:focus-visible": { outline: "none" } }}>
            {ct(peptide.name)}
          </AppLink>
        </Typography>
        {peptide.aka ? <Typography sx={{ fontSize: 12.5, color: "text.secondary", mt: .25 }}>{ct(peptide.aka)}</Typography> : null}
        <Typography sx={{ mt: 1.25, fontSize: 14, lineHeight: 1.65, color: "text.secondary", flex: 1 }}>{ct(profile ? profile.oneLiner : "Guide coming soon. We're writing it now.")}</Typography>
        <Box sx={{ mt: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          {profile ? <StatusBadge status={profile.status} size="small" /> : <Box component="span" sx={{ display: "inline-flex", alignItems: "center", px: 1, py: .25, borderRadius: 999, bgcolor: "brand.mintWash", color: "brand.navySoft", fontSize: 12, fontWeight: 600 }}>{ct("Coming soon")}</Box>}
          <Icon name="arrowUpRight" aria-hidden sx={{ fontSize: 18, color: "brand.navy" }} />
        </Box>
      </Box>
    </Box>
  )
}
