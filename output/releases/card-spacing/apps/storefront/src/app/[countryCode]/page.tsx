import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Icon from "@/components/brand/Icon"
import { ButtonLink } from "@/components/common/links"
import Section from "@/components/common/Section"
import SectionHeading from "@/components/common/SectionHeading"
import Hero from "@/components/home/Hero"
import ResearchStandard from "@/components/home/ResearchStandard"
import PeptideVideos from "@/components/education/PeptideVideos"
import ProductGrid from "@/components/product/ProductGrid"
import { getCurrentRegion } from "@/lib/medusa/current-region"
import { listProducts } from "@/lib/medusa/products"

export default async function HomePage() {
  const { region } = await getCurrentRegion()
  const products = await listProducts({ regionId: region.id })
  const featured = ["retatrutide", "tirzepatide", "semaglutide"].flatMap(handle => products.filter(product => product.handle === handle))
  const collection = featured.length ? featured : products.slice(0, 3)
  return <>
    <Hero products={products} />
    <Section tone="white" id="catalog" sx={{ pt: { xs: 6, md: 9 }, pb: { xs: 7, md: 10 } }}>
      <SectionHeading eyebrow="01 / The collection" title="The science. Clearly presented." description="Explore the VETUD Peptide Series. Considered packaging, clear product information and research at its core." action={<ButtonLink href="/shop" variant="outlined" endIcon={<Icon name="arrowUpRight" />}>View the collection</ButtonLink>} />
      {collection.length ? <ProductGrid products={collection} /> : <Box sx={{ p: 5, bgcolor: "brand.mintWash", borderRadius: 3 }}><Typography>Our catalog is being updated. Contact us for availability.</Typography><ButtonLink href="/contact" sx={{ mt: 2 }} endIcon={<Icon name="arrowRight" />}>Contact us</ButtonLink></Box>}
    </Section>
    <ResearchStandard />
    <PeptideVideos />
  </>
}
