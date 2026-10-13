import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Icon from "@/components/brand/Icon"
import { ButtonLink } from "@/components/common/links"
import Section from "@/components/common/Section"
import SectionHeading from "@/components/common/SectionHeading"
import Hero from "@/components/home/Hero"
import SpraySpotlight from "@/components/home/SpraySpotlight"
import PeptideVideos from "@/components/education/PeptideVideos"
import ProductGrid from "@/components/product/ProductGrid"
import { getCurrentRegion } from "@/lib/medusa/current-region"
import { listCategories, listProducts } from "@/lib/medusa/products"

const PEN_ORDER = ["retatrutide", "tirzepatide", "semaglutide"]

export default async function HomePage() {
  const { region } = await getCurrentRegion()
  const category = (await listCategories()).find((item) => item.handle === "peptide-series")
  const products = category ? await listProducts({ regionId: region.id, categoryId: category.id }) : []
  const pens = products.filter((product) => PEN_ORDER.includes(product.handle ?? "")).sort((a, b) => PEN_ORDER.indexOf(a.handle ?? "") - PEN_ORDER.indexOf(b.handle ?? ""))
  const collection = [...pens, ...products.filter((product) => !PEN_ORDER.includes(product.handle ?? ""))]
  const sprays = ["selank", "semax"].flatMap((handle) => products.filter((product) => product.handle === handle))
  return <>
    <Hero />
    <Section tone="white" id="catalog" sx={{ pt: { xs: 6, md: 9 }, pb: { xs: 7, md: 10 } }}>
      <SectionHeading eyebrow="01 / The complete collection" title="Discover the Peptide Series." description="Explore our full collection: Retatrutide, Tirzepatide and Semaglutide pen kits in 10 mg, 20 mg and 40 mg, alongside Selank and Semax in 10 ml spray formats." action={<ButtonLink href="/shop" variant="outlined" endIcon={<Icon name="arrowUpRight" />}>View the collection</ButtonLink>} />
      {collection.length ? <ProductGrid products={collection} /> : <Box sx={{ p: 5, bgcolor: "brand.mintWash", borderRadius: 3 }}><Typography>Our collection is being updated.</Typography><ButtonLink href="/shop" sx={{ mt: 2 }} endIcon={<Icon name="arrowRight" />}>Explore the catalog</ButtonLink></Box>}
    </Section>
    <SpraySpotlight products={sprays} />
    <PeptideVideos />
  </>
}
