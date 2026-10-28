import Box from "@mui/material/Box"
import { getTranslations } from "next-intl/server"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import Icon from "../brand/Icon"
import { ButtonLink, LocalizedNextLink } from "../common/links"
import { gutter } from "@/theme/tokens"

const pathways = [
  { icon: "flask" as const, title: "Explore the collection", detail: "Research materials, clearly specified", href: "/shop" },
  { icon: "document" as const, title: "Know your material", detail: "Lot records & certificates of analysis", href: "/documentation" },
  { icon: "shield" as const, title: "The VETUD standard", detail: "A considered approach to quality", href: "/standards" },
]

export default async function Hero() {
  const t = await getTranslations("Hero")
  return <Box component="section" aria-labelledby="hero-title" sx={{ position: "relative", overflow: "hidden", bgcolor: "#fbfcfe" }}>
    <Box sx={{ textAlign: "center", px: gutter, pt: { xs: 6, md: 8.5 }, position: "relative", zIndex: 1 }}>
      <Typography variant="mono" component="p" sx={{ color: "brand.blue", fontSize: 10.5, letterSpacing: ".2em", textTransform: "uppercase", mb: 2.75 }}>VETUD / Peptide Series</Typography>
      <Typography component="h1" id="hero-title" sx={{ fontSize: { xs: 43, sm: 62, md: 76 }, fontWeight: 400, letterSpacing: "-.065em", lineHeight: 1.09, maxWidth: 980, mx: "auto" }}>
        {t("first")}<br /><Box component="span" sx={{ color: "brand.blue" }}>{t("second")}</Box>
      </Typography>
      <Typography sx={{ maxWidth: 530, mx: "auto", color: "text.secondary", mt: 3, fontSize: { xs: 15, md: 16 }, lineHeight: 1.85 }}>{t("description")}<br />{t("detail")}</Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "center", alignItems: "center", mt: 3.5 }}>
        <ButtonLink href="/shop" variant="contained" endIcon={<Icon name="arrowUpRight" />}>{t("explore")}</ButtonLink>
        <ButtonLink href="/standards" variant="outlined">{t("standards")}</ButtonLink>
      </Stack>
    </Box>
    <Box sx={{ position: "relative", height: { xs: 210, sm: 275, md: 320 }, mt: { xs: 0, md: -1 }, pointerEvents: "none" }}>
      <Image src="/images/vetud-alpine-landscape.webp" alt="VETUD alpine landscape with molecular structures and flowing blue lines" fill priority sizes="100vw" style={{ objectFit: "cover", objectPosition: "center 80%", maskImage: "linear-gradient(to bottom, transparent, black 23%, black 88%, transparent)" }} />
      <Typography variant="mono" sx={{ position: "absolute", left: 64, bottom: 28, fontSize: 9, color: "brand.navy", letterSpacing: ".12em", display: { xs: "none", md: "block" } }}>INSPIRED BY CLARITY. GROUNDED IN SCIENCE.</Typography>
      <Typography variant="mono" sx={{ position: "absolute", right: 64, bottom: 28, fontSize: 9, color: "brand.navy", letterSpacing: ".12em", display: { xs: "none", md: "block" } }}>FOR LABORATORY RESEARCH ONLY</Typography>
    </Box>
    <Box sx={{ px: gutter, bgcolor: "#fff", borderBottom: "1px solid", borderColor: "divider" }}>
      <Box sx={{ maxWidth: 1360, mx: "auto", display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
        {pathways.map((item, index) => <Box key={item.href} component={LocalizedNextLink} href={item.href} sx={{ display: "flex", alignItems: "center", gap: 2, py: { xs: 2.25, md: 3.5 }, px: { xs: 0, md: index ? 4 : 0 }, borderLeft: { md: index ? "1px solid" : "none" }, borderBottom: { xs: index < 2 ? "1px solid" : "none", md: "none" }, borderColor: "divider", textDecoration: "none", "&:hover": { color: "brand.blue" }, "&:hover .pathway-arrow": { transform: "translate(3px,-3px)" } }}>
          <Icon name={item.icon} sx={{ color: "brand.blue", fontSize: 23 }} /><Box sx={{ flex: 1 }}><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.title}</Typography><Typography sx={{ fontSize: 11.5, color: "text.secondary", mt: .3 }}>{item.detail}</Typography></Box><Icon name="arrowUpRight" className="pathway-arrow" sx={{ fontSize: 17, transition: "transform .2s" }} />
        </Box>)}
      </Box>
    </Box>
  </Box>
}
