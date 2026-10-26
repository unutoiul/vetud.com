import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Icon from "@/components/brand/Icon"
import { ButtonLink } from "@/components/common/links"
import Section from "@/components/common/Section"
import SectionHeading from "@/components/common/SectionHeading"
import Hero from "@/components/home/Hero"
import PeptideVideos from "@/components/education/PeptideVideos"
import ProductGrid from "@/components/product/ProductGrid"
import { getCurrentRegion } from "@/lib/medusa/current-region"
import { listProducts } from "@/lib/medusa/products"

export default async function HomePage() {
  const { region } = await getCurrentRegion()
  const products = await listProducts({ regionId: region.id })
  return <>
    <Hero />
    <Section tone="white" id="catalog" sx={{ pt: { xs: 6, md: 9 }, pb: { xs: 7, md: 10 } }}>
      <SectionHeading eyebrow="01 / The collection" title="Research materials." description="Research-grade peptides for qualified laboratories, each with lot-level documentation and a certificate of analysis." action={<ButtonLink href="/shop" variant="outlined" endIcon={<Icon name="arrowUpRight" />}>View the collection</ButtonLink>} />
      {products.length ? <ProductGrid products={products} /> : <Box sx={{ p: 5, bgcolor: "brand.mintWash", borderRadius: 3 }}><Typography>Our catalog is being updated. Contact us for availability.</Typography><ButtonLink href="/contact" sx={{ mt: 2 }} endIcon={<Icon name="arrowRight" />}>Contact us</ButtonLink></Box>}
    </Section>
    <PeptideVideos />
  </>
}
