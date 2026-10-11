import NorthEastIcon from "@mui/icons-material/NorthEast"
import Grid from "@mui/material/Grid"
import Typography from "@mui/material/Typography"
import { ButtonLink } from "@/components/common/links"
import Section from "@/components/common/Section"
import SectionHeading, { SerifAccent } from "@/components/common/SectionHeading"
import Hero from "@/components/home/Hero"
import LotLookupBand from "@/components/home/LotLookupBand"
import Manifesto from "@/components/home/Manifesto"
import StandardsAccordion from "@/components/home/StandardsAccordion"
import TrustBar from "@/components/home/TrustBar"
import ProductGrid from "@/components/product/ProductGrid"
import { getCurrentRegion } from "@/lib/medusa/current-region"
import { getCollectionByHandle, listProducts } from "@/lib/medusa/products"
import { sortProducts } from "@/lib/product"

export default async function HomePage() {
  const { region } = await getCurrentRegion()
  const featured = await getCollectionByHandle("featured")
  const products = await listProducts({ regionId: region.id, collectionId: featured?.id, limit: 6 })

  return (
    <>
      <Hero />
      <TrustBar />

      <Section tone="white" id="catalog">
        <SectionHeading
          eyebrow={`The collection / 01–${String(products.length).padStart(2, "0")}`}
          title="Designed for discovery."
          description="A focused catalog with the documentation and product details your workflow needs."
          action={
            <ButtonLink href="/shop" variant="outlined" size="small" endIcon={<NorthEastIcon />}>
              View all products
            </ButtonLink>
          }
        />
        <ProductGrid products={sortProducts(products, "featured")} density="four" />
      </Section>

      <Section tone="wash" id="standards">
        <Grid container spacing={{ xs: 5, md: 10 }} sx={{ alignItems: "center" }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Typography variant="eyebrow" sx={{ color: "secondary.main" }}>
              The Vetud standard
            </Typography>
            <Typography variant="h2" sx={{ mt: 1.5, mb: 2.5 }}>
              Details matter. We make them <SerifAccent>visible.</SerifAccent>
            </Typography>
            <Typography sx={{ color: "text.secondary", maxWidth: 440 }}>
              Confidence starts with clear information. Every listing puts the technical record
              within reach, from purity and storage to the lot your vial came from.
            </Typography>
            <ButtonLink href="/standards" variant="text" color="secondary" endIcon={<NorthEastIcon />} sx={{ mt: 3, px: 0 }}>
              How we work
            </ButtonLink>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <StandardsAccordion />
          </Grid>
        </Grid>
      </Section>

      <Section tone="paper" tight>
        <LotLookupBand />
      </Section>

      <Manifesto />
    </>
  )
}
