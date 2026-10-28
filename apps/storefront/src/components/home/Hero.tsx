import type { HttpTypes } from "@medusajs/types"
import Box from "@mui/material/Box"
import { getTranslations } from "next-intl/server"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import Icon from "../brand/Icon"
import { ButtonLink, LocalizedNextLink } from "../common/links"
import { brand, gutter } from "@/theme/tokens"
import CollectionCarousel from "./CollectionCarousel"

const pathways = [
  { icon: "flask" as const, title: "Explore the collection", detail: "Research materials, clearly specified", href: "/shop" },
  { icon: "document" as const, title: "Know your material", detail: "Lot records & certificates of analysis", href: "/documentation" },
  { icon: "shield" as const, title: "The VETUD standard", detail: "A considered approach to quality", href: "/standards" },
]

export default async function Hero({ products }: { products: HttpTypes.StoreProduct[] }) {
  const t = await getTranslations("Hero")
  return <Box component="section" aria-labelledby="hero-title" sx={{ position: "relative", overflow: "hidden", bgcolor: brand.paper }}>
    <Box data-hero-stage sx={{ position: "relative", px: gutter, isolation: "isolate" }}>
      <Box sx={{ position: "absolute", inset: "auto 0 0", height: { xs: 320, md: 300 }, zIndex: -1, pointerEvents: "none" }}>
        <Image src="/images/vetud-alpine-landscape.webp" alt="" fill preload sizes="100vw" style={{ objectFit: "cover", objectPosition: "center 80%", maskImage: "linear-gradient(to bottom, transparent, black 35%, black 88%, transparent)" }} />
      </Box>
      <Box aria-hidden="true" sx={{ position: "absolute", inset: 0, zIndex: -1, pointerEvents: "none", background: { md: `linear-gradient(90deg, ${brand.paper}e6 0%, ${brand.paper}b3 40%, ${brand.paper}00 70%)` } }} />
      <Box sx={{ maxWidth: 1360, mx: "auto", display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, .95fr) minmax(0, 1.05fr)" }, alignItems: "center", gap: { xs: 1, md: 4, lg: 7 }, minHeight: { md: 660 }, pt: { xs: 5, md: 6 }, pb: { xs: 4, md: 9 } }}>
        <Box sx={{ textAlign: { xs: "center", md: "left" }, position: "relative", zIndex: 2 }}>
          <Typography variant="mono" component="p" sx={{ color: "brand.blue", fontSize: 10.5, letterSpacing: ".2em", textTransform: "uppercase", mb: 2.75 }}>VETUD / Peptide Series</Typography>
          <Typography component="h1" id="hero-title" sx={{ fontSize: { xs: 42, sm: 58, md: 54, lg: 64 }, fontWeight: 400, letterSpacing: "-.065em", lineHeight: 1.08, textWrap: "balance", maxWidth: { xs: 800, md: 620 }, mx: "auto" }}>
            {t("first")}<br /><Box component="span" sx={{ color: "brand.blue" }}>{t("second")}</Box>
          </Typography>
          <Typography sx={{ maxWidth: 480, mx: { xs: "auto", md: 0 }, color: "brand.navySoft", mt: 3, fontSize: { xs: 15, md: 16 }, lineHeight: 1.85 }}>{t("description")}<br />{t("detail")}</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: { xs: "center", md: "flex-start" }, alignItems: "center", mt: 3.5 }}>
            <ButtonLink href="/shop" variant="contained" endIcon={<Icon name="arrowUpRight" />}>{t("explore")}</ButtonLink>
            <ButtonLink href="/standards" variant="outlined" sx={{ bgcolor: "#ffffffcc" }}>{t("standards")}</ButtonLink>
          </Stack>
        </Box>
        <CollectionCarousel products={products} />
      </Box>
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
