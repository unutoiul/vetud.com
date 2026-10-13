import type { Metadata } from "next"
import Image from "next/image"
import Box from "@mui/material/Box"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import Icon from "@/components/brand/Icon"
import { ButtonLink } from "@/components/common/links"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import { getCurrentRegion } from "@/lib/medusa/current-region"
import { getProductByHandle } from "@/lib/medusa/products"

export const metadata: Metadata = { title: "Discover", description: "Explore the VETUD Peptide Series: dual-chamber pen kits and 10 ml Selank and Semax sprays." }

export default async function DiscoverPage() {
  const { region } = await getCurrentRegion()
  const selank = await getProductByHandle("selank", region.id)
  return <>
    <PageHeader eyebrow="Discover" title="One collection. Two formats." description="Meet the Peptide Series. Explore the products, compare their formats and find the details that matter to you." />
    <Section tone="white" sx={{ py: { xs: 5, md: 8 } }}>
      <Box sx={{ position: "relative", aspectRatio: "16 / 9", borderRadius: { xs: 3, md: 5 }, overflow: "hidden", mb: { xs: 5, md: 8 } }}><Image src="/images/vetud-complete-collection-alpine.png" alt="The five VETUD Peptide Series products beside an alpine lake" fill sizes="(max-width: 1400px) 100vw, 1360px" style={{ objectFit: "cover" }} /></Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 5, md: 8 } }}>
        <Box><Typography variant="eyebrow" sx={{ color: "brand.blue" }}>01 / Peptide pens</Typography><Typography component="h2" variant="h3" sx={{ my: 2 }}>A format with two chambers.</Typography><Typography sx={{ color: "text.secondary", mb: 3 }}>Retatrutide, Tirzepatide and Semaglutide kits are offered in 10 mg, 20 mg and 40 mg. Each dual-chamber pen keeps freeze-dried peptide powder and BAC water in separate chambers. Compare amounts, ingredients and availability on the product pages.</Typography><ButtonLink href="/shop" variant="outlined" endIcon={<Icon name="arrowUpRight" />}>Explore the pens</ButtonLink></Box>
        <Box><Typography variant="eyebrow" sx={{ color: "brand.teal" }}>02 / Nasal sprays</Typography><Typography component="h2" variant="h3" sx={{ my: 2 }}>Selank and Semax, in 10 ml.</Typography><Typography sx={{ color: "text.secondary", mb: 3 }}>The spray collection pairs a 10 ml bottle with its matching box. Bottle volume describes the liquid quantity; it is separate from peptide strength. Each product page explains the available ingredient information.</Typography><Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: "wrap" }}><ButtonLink href="/products/selank" variant="outlined" endIcon={<Icon name="arrowUpRight" />}>Selank</ButtonLink><ButtonLink href="/products/semax" variant="outlined" endIcon={<Icon name="arrowUpRight" />}>Semax</ButtonLink></Stack></Box>
      </Box>
    </Section>
    <Section tone="paper" sx={{ py: { xs: 5, md: 8 } }}><Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 4, md: 8 }, alignItems: "center" }}>{selank?.thumbnail && <Box sx={{ position: "relative", aspectRatio: "4 / 3", borderRadius: 3, overflow: "hidden" }}><Image src={selank.thumbnail} alt="VETUD Selank bottle and box in the alpine collection" fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: "cover" }} /></Box>}<Box><Typography component="h2" variant="h3" sx={{ mb: 2 }}>Get to know the details.</Typography><Typography sx={{ color: "text.secondary", mb: 3 }}>Learn what peptide amounts, bottle volumes and purity measurements mean before comparing the collection.</Typography><ButtonLink href="/education#peptide-videos" variant="contained" startIcon={<Icon name="play" />}>Watch peptide basics</ButtonLink></Box></Box></Section>
  </>
}
