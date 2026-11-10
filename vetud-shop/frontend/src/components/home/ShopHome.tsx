import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { getTranslations } from "next-intl/server"
import Icon from "@/components/brand/Icon"
import { ButtonLink } from "@/components/common/links"
import CollectionCarousel from "@/components/home/CollectionCarousel"
import HomeCatalog from "@/components/home/HomeCatalog"
import Section from "@/components/common/Section"
import SectionHeading from "@/components/common/SectionHeading"
import { getContentTranslator } from "@/i18n/server-content"
import { SITE } from "@/lib/config"
import { getCurrentRegion } from "@/lib/medusa/current-region"
import { categoryFacets } from "@/lib/catalog-filters"
import { listCatalogProducts, listCategories } from "@/lib/medusa/products"
import { sortProducts } from "@/lib/product"
import { localizedWebsiteStructuredData } from "@/lib/storefront-seo"
import { brand, gutter } from "@/theme/tokens"

/** The home page: the collection, then the whole catalog by category. */
export default async function ShopHome() {
  const ct = await getContentTranslator()
  const act = await getTranslations("Actions")
  const { region } = await getCurrentRegion()
  const [products, categories] = await Promise.all([listCatalogProducts(region.id), listCategories()])
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localizedWebsiteStructuredData(ct.locale)).replace(/</g, "\\u003c") }} />
    <Box component="section" aria-labelledby="collection-heading" sx={{ position: "relative", isolation: "isolate", overflow: "clip", bgcolor: brand.mintWash, px: gutter, pt: { xs: 4, md: 6 }, pb: { xs: 4, md: 5 }, borderBottom: "1px solid", borderColor: "divider" }}>
      {/* Static molecular linework echoes the packaging without adding video or motion. */}
      <Box component="svg" viewBox="0 0 1600 850" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: -1, pointerEvents: "none", color: brand.cyan }}>
        <ellipse cx="800" cy="560" rx="750" ry="240" fill={brand.mintLight} />
        <g fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".45">
          <path d="M-70 300 60 225 190 300v150L60 525-70 450Zm260 0 130-75 130 75v150l-130 75-130-75m-130 75v150l130 75 130-75V525M450 300l130-75 130 75M1320 100l130 75v150l-130 75-130-75V175Zm130 225 130 75v150l-130 75-130-75V400m260 150 130 75M1190 175l-130-75m260 450-130 75v150" />
          <ellipse cx="800" cy="610" rx="720" ry="145" />
          <ellipse cx="800" cy="610" rx="610" ry="110" />
        </g>
        <g fill={brand.cyan} opacity=".55">
          <circle cx="60" cy="225" r="6" /><circle cx="190" cy="450" r="8" /><circle cx="320" cy="225" r="5" /><circle cx="320" cy="675" r="6" />
          <circle cx="1190" cy="175" r="7" /><circle cx="1450" cy="325" r="8" /><circle cx="1320" cy="550" r="6" /><circle cx="1190" cy="775" r="5" />
        </g>
      </Box>
      <Box sx={{ maxWidth: 1600, mx: "auto" }}>
        <Box component="header" sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { xs: "flex-start", md: "flex-end" }, justifyContent: "space-between", gap: 3, mb: { xs: 3, md: 4 } }}>
          <Box sx={{ maxWidth: 760 }}>
            <Typography id="collection-heading" component="h1" sx={{ fontSize: { xs: 34, sm: 44, md: 52 }, fontWeight: 400, lineHeight: 1.12, letterSpacing: "-.05em", textWrap: "balance" }}>{ct("Research peptides & laboratory materials.")}</Typography>
            <Typography sx={{ mt: 2, maxWidth: 620, fontSize: { xs: 14, md: 16 }, lineHeight: 1.7, color: "text.secondary" }}>{ct("Research materials with lot documentation, for laboratory research use only.")}</Typography>
          </Box>
          <ButtonLink href="/shop" variant="contained" endIcon={<Icon name="arrowUpRight" />} sx={{ flexShrink: 0 }}>{act("shopCatalog")}</ButtonLink>
        </Box>
        {products.length ? <CollectionCarousel products={sortProducts(products, "relevance")} /> : <Typography sx={{ py: 6, color: "text.secondary" }}>{ct("Our catalog is being updated. Contact us for availability.")}</Typography>}
        <Typography sx={{ mt: 3, fontSize: 12.5, color: "text.secondary", textAlign: "center" }}>{ct(SITE.catalogNotice)}</Typography>
      </Box>
    </Box>

    {products.length ? (
      <Section tone="white" tight>
        <SectionHeading eyebrow="Shop by category" title="Find the right material." description="Choose a category to see its products." />
        <HomeCatalog products={sortProducts(products, "relevance")} categories={categoryFacets(categories, products)} />
      </Section>
    ) : null}
  </>
}
