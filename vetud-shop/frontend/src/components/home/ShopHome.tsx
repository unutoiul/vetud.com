import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { getTranslations } from "next-intl/server"
import Icon from "@/components/brand/Icon"
import { ButtonLink } from "@/components/common/links"
import Section from "@/components/common/Section"
import VideoHero, { SHOP_HERO_VIDEO } from "@/components/common/VideoHero"
import CollectionCarousel from "@/components/home/CollectionCarousel"
import Manifesto from "@/components/home/Manifesto"
import ResearchStandard from "@/components/home/ResearchStandard"
import { getContentTranslator } from "@/i18n/server-content"
import { SITE } from "@/lib/config"
import { getCurrentRegion } from "@/lib/medusa/current-region"
import { listCatalogProducts } from "@/lib/medusa/products"
import { localizedWebsiteStructuredData } from "@/lib/storefront-seo"

/** The home page: the collection first, then how it is made and checked. */
export default async function ShopHome() {
  const ct = await getContentTranslator()
  const act = await getTranslations("Actions")
  const { region } = await getCurrentRegion()
  const products = await listCatalogProducts(region.id)
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localizedWebsiteStructuredData(ct.locale)).replace(/</g, "\\u003c") }} />
    <VideoHero video={SHOP_HERO_VIDEO} eyebrow={ct("The collection")} title={ct("Research peptides & laboratory materials.")} description={ct("Research materials with lot documentation, for laboratory research use only.")}>
      <ButtonLink href="/shop" variant="contained" endIcon={<Icon name="arrowUpRight" />}>{act("shopCatalog")}</ButtonLink>
    </VideoHero>

    <Section tone="white" sx={{ py: { xs: 6, md: 9 } }}>
      {/* The carousel peeks past its edges by design; clip it to the section (clip, unlike hidden, adds no scroll container). */}
      {products.length ? <Box sx={{ overflowX: "clip" }}><CollectionCarousel products={products} /></Box> : <Typography sx={{ color: "text.secondary" }}>{ct("Our catalog is being updated. Contact us for availability.")}</Typography>}
      <Typography sx={{ mt: 3, fontSize: 12.5, color: "text.secondary" }}>{ct(SITE.catalogNotice)}</Typography>
    </Section>

    <ResearchStandard />
    <Manifesto />
  </>
}
