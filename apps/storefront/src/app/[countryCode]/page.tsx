import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import Icon, { type IconName } from "@/components/brand/Icon"
import { ButtonLink, LocalizedNextLink } from "@/components/common/links"
import Section from "@/components/common/Section"
import SectionHeading from "@/components/common/SectionHeading"
import Hero from "@/components/home/Hero"
import LotLookupBand from "@/components/home/LotLookupBand"
import Manifesto from "@/components/home/Manifesto"
import StandardsAccordion from "@/components/home/StandardsAccordion"
import TrustBar from "@/components/home/TrustBar"
import ProductGrid from "@/components/product/ProductGrid"
import { getCurrentRegion } from "@/lib/medusa/current-region"
import { getCollectionByHandle, listProducts } from "@/lib/medusa/products"
import { sortProducts } from "@/lib/product"
import { motion } from "@/theme/tokens"

const CATEGORIES: { name: string; description: string; href: string; icon: IconName }[] = [
  { name: "Peptide series", description: "A focused research collection", href: "/shop?category=peptide-series", icon: "molecule" },
  { name: "Research blends", description: "Considered combinations", href: "/shop?category=blends", icon: "flask" },
  { name: "Lab essentials", description: "Complete your workflow", href: "/shop?category=lab-supplies", icon: "package" },
]

export default async function HomePage() {
  const { region } = await getCurrentRegion()
  const featured = await getCollectionByHandle("featured")
  const products = await listProducts({ regionId: region.id, collectionId: featured?.id, limit: 4 })
  return <>
    <Hero />
    <TrustBar />
    <Section tone="white" id="catalog">
      <SectionHeading eyebrow="The VETUD collection" title="Considered down to the molecule." description="Explore research materials with the details that matter, clearly presented." action={<ButtonLink href="/shop" variant="outlined" endIcon={<Icon name="arrowUpRight" />}>Shop all products</ButtonLink>} />
      {products.length ? <ProductGrid products={sortProducts(products, "featured")} density="four" /> : <Box sx={{ p: 5, bgcolor: "brand.mintWash", borderRadius: 3 }}><Typography>Our collection is being updated.</Typography><ButtonLink href="/shop" sx={{ mt: 2 }} endIcon={<Icon name="arrowRight" />}>Explore the catalog</ButtonLink></Box>}
      <Box sx={{ mt: { xs: 5, md: 7 }, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3,1fr)" }, gap: { xs: 1, md: 4 } }}>
        {CATEGORIES.map((category) => <Box key={category.name} component={LocalizedNextLink} href={category.href} sx={{ display: "flex", gap: 2, alignItems: "center", py: 2.5, textDecoration: "none", borderTop: "1px solid rgba(23,53,75,.08)", transition: `color .3s ${motion}`, "&:hover": { color: "brand.blue" }, "&:hover .category-arrow": { transform: "translate(3px,-3px)" } }}>
          <Icon name={category.icon} sx={{ fontSize: 29, color: "brand.blue" }} /><Box sx={{ flex: 1 }}><Typography sx={{ fontSize: 16, fontWeight: 600 }}>{category.name}</Typography><Typography sx={{ fontSize: 12, color: "text.secondary", mt: .25 }}>{category.description}</Typography></Box><Icon name="arrowUpRight" className="category-arrow" sx={{ fontSize: 19, transition: `transform .3s ${motion}` }} />
        </Box>)}
      </Box>
    </Section>
    <Section tone="wash" id="standards">
      <Grid container spacing={{ xs: 5, md: 10 }} sx={{ alignItems: "center" }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2.5 }}><Icon name="shield" sx={{ fontSize: 19, color: "brand.teal" }} /><Typography variant="eyebrow" sx={{ color: "secondary.main" }}>The VETUD standard</Typography></Stack>
          <Typography variant="h2" sx={{ mb: 3, maxWidth: 460 }}>Good science deserves a clear foundation.</Typography>
          <Typography sx={{ color: "text.secondary", maxWidth: 420 }}>From material specifications to the record behind a batch, we put the information your research needs within reach.</Typography>
          <ButtonLink href="/standards" variant="outlined" endIcon={<Icon name="arrowUpRight" />} sx={{ mt: 4 }}>Explore our standards</ButtonLink>
          <Stack direction="row" spacing={4} sx={{ mt: 5 }}><Box><Icon name="leaf" sx={{ fontSize: 26, color: "brand.teal", mb: .75 }} /><Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>Thoughtfully handled</Typography></Box><Box><Icon name="snowflake" sx={{ fontSize: 26, color: "brand.blue", mb: .75 }} /><Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>Clearly specified storage</Typography></Box></Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}><StandardsAccordion /></Grid>
      </Grid>
    </Section>
    <Section tone="white" tight><LotLookupBand /></Section>
    <Manifesto />
  </>
}
