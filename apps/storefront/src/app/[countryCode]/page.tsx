import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Icon from "@/components/brand/Icon"
import { ButtonLink } from "@/components/common/links"
import Section from "@/components/common/Section"
import SectionHeading from "@/components/common/SectionHeading"
import CollectionCarousel from "@/components/home/CollectionCarousel"
import LearnHero from "@/components/home/LearnHero"
import ResearchStandard from "@/components/home/ResearchStandard"
import ArticleCard from "@/components/learn/ArticleCard"
import VideoGallery from "@/components/learn/VideoGallery"
import WeightLossChart from "@/components/learn/WeightLossChart"
import { ARTICLES } from "@/content/learn/articles"
import { getVideos } from "@/content/learn/videos"
import { SITE } from "@/lib/config"
import { getCurrentRegion } from "@/lib/medusa/current-region"
import { listCatalogProducts } from "@/lib/medusa/products"

export default async function HomePage() {
  const { region } = await getCurrentRegion()
  const products = await listCatalogProducts(region.id)
  return <>
    <LearnHero />

    <Section tone="white" sx={{ py: { xs: 6, md: 9 } }}>
      <SectionHeading eyebrow="Results" title="What the weight-loss trials found." description="Average weight lost in the main published trials of today’s leading medicines, each compared with a placebo." action={<ButtonLink href="/learn#weight" variant="outlined" endIcon={<Icon name="arrowRight" />}>Weight management guides</ButtonLink>} />
      <WeightLossChart />
    </Section>

    <Section tone="paper" sx={{ py: { xs: 6, md: 9 } }}>
      <SectionHeading eyebrow="News & articles" title="New research, explained." description="Recent studies and decisions, written so anyone can follow them, with every source linked." action={<ButtonLink href="/news" variant="outlined" endIcon={<Icon name="arrowRight" />}>All articles</ButtonLink>} />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: { xs: 4, md: 3.5 } }}>
        {ARTICLES.slice(1, 4).map((article) => <ArticleCard key={article.slug} article={article} />)}
      </Box>
    </Section>

    <Section tone="white" sx={{ py: { xs: 6, md: 9 } }}>
      <SectionHeading eyebrow="Videos" title="Doctors explain." description="Hand-picked videos, mostly from doctors, including some skeptical ones." action={<ButtonLink href="/videos" variant="outlined" endIcon={<Icon name="arrowRight" />}>All videos</ButtonLink>} />
      <VideoGallery videos={getVideos(["o8YMLTfNYtc", "QGIFdakceHM", "xpdLs-_nl4g"])} />
    </Section>

    {/* The shop is its own section, kept apart from the learning content above. */}
    <Section tone="wash" id="shop" aria-labelledby="home-shop-title" sx={{ py: { xs: 6, md: 9 }, borderTop: "1px solid", borderColor: "divider" }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", alignItems: { md: "flex-end" }, gap: 3, mb: { xs: 3, md: 4 } }}>
        <Box>
          <Typography variant="eyebrow" component="p" sx={{ color: "brand.blue" }}>Shop</Typography>
          <Typography id="home-shop-title" variant="h2" component="h2" sx={{ mt: 1.5, fontSize: { xs: 34, md: 44 } }}>The VETUD Peptide Series.</Typography>
          <Typography sx={{ mt: 1.5, color: "text.secondary", maxWidth: 620 }}>Research materials with lot documentation, for laboratory research use only.</Typography>
        </Box>
        <ButtonLink href="/shop" variant="contained" endIcon={<Icon name="arrowUpRight" />} sx={{ flexShrink: 0 }}>Visit the shop</ButtonLink>
      </Box>
      {/* The carousel peeks past its edges by design; clip it to the section (clip, unlike hidden, adds no scroll container). */}
      {products.length ? <Box sx={{ overflowX: "clip" }}><CollectionCarousel products={products} /></Box> : <Typography sx={{ color: "text.secondary" }}>Our catalog is being updated. Contact us for availability.</Typography>}
      <Typography sx={{ mt: 3, fontSize: 12.5, color: "text.secondary" }}>{SITE.productDisclaimer}</Typography>
    </Section>

    <ResearchStandard />
  </>
}
