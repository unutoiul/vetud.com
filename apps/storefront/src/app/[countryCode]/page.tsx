import Box from "@mui/material/Box"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import Icon from "@/components/brand/Icon"
import { ButtonLink } from "@/components/common/links"
import Section from "@/components/common/Section"
import SectionHeading from "@/components/common/SectionHeading"
import Hero from "@/components/home/Hero"
import SpraySpotlight from "@/components/home/SpraySpotlight"
import ProductGrid from "@/components/product/ProductGrid"
import { getCurrentRegion } from "@/lib/medusa/current-region"
import { listCategories, listProducts } from "@/lib/medusa/products"

const PEN_ORDER = ["retatrutide", "tirzepatide", "semaglutide"]
const DETAILS = [
  { icon: "flask" as const, title: "99% purity", text: "Lab tested for purity." },
  { icon: "document" as const, title: "Details, made clear", text: "Amounts, formats and ingredient information in one place." },
  { icon: "support" as const, title: "A real conversation", text: "Contact the team with product and order questions." },
]

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
    <Section tone="wash" sx={{ py: { xs: 6, md: 8 } }}>
      <Stack direction={{ xs: "column", md: "row" }} sx={{ justifyContent: "space-between", alignItems: { md: "center" }, gap: 3, mb: { xs: 4, md: 5 } }}><Typography variant="h3" component="h2">Clarity comes first.</Typography><ButtonLink href="/standards" variant="text" endIcon={<Icon name="arrowUpRight" />}>Our standards</ButtonLink></Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3,1fr)" }, gap: { xs: 3, md: 5 } }}>{DETAILS.map((detail) => <Stack key={detail.title} direction="row" spacing={2} sx={{ alignItems: "flex-start" }}><Icon name={detail.icon} sx={{ color: "brand.blue", fontSize: 25, mt: .25 }} /><Box><Typography sx={{ fontSize: 14, fontWeight: 600 }}>{detail.title}</Typography><Typography sx={{ fontSize: 12.5, color: "text.secondary", mt: .75, maxWidth: 300 }}>{detail.text}</Typography></Box></Stack>)}</Box>
    </Section>
  </>
}
