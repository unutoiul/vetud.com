import Box from "@mui/material/Box"
import Breadcrumbs from "@mui/material/Breadcrumbs"
import Link from "@mui/material/Link"
import Skeleton from "@mui/material/Skeleton"
import Typography from "@mui/material/Typography"
import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Suspense, type ReactNode } from "react"
import Icon from "@/components/brand/Icon"
import { AppLink } from "@/components/common/links"
import Section from "@/components/common/Section"
import ArticleArt from "@/components/learn/ArticleArt"
import ArticleCard from "@/components/learn/ArticleCard"
import PeptideCard from "@/components/learn/PeptideCard"
import ResearchCatalog from "@/components/learn/ResearchCatalog"
import SourceList, { LEARN_DISCLAIMER } from "@/components/learn/SourceList"
import StatusBadge from "@/components/learn/StatusBadge"
import VideoResources from "@/components/learn/VideoResources"
import WeightLossChart from "@/components/learn/WeightLossChart"
import { ARTICLES } from "@/content/learn/articles"
import { EMERGING_WEIGHT_RESEARCH } from "@/content/learn/emerging-weight-research"
import { getCategory, STATUSES } from "@/content/learn/categories"
import { getPeptide, PEPTIDES } from "@/content/learn/peptides"
import { getProfileVideoResources } from "@/content/learn/video-resources"
import { WEIGHT_LOSS_TRIALS } from "@/content/learn/weight-loss-trials"
import { gutter } from "@/theme/tokens"

export function generateStaticParams() {
  return PEPTIDES.map((peptide) => ({ slug: peptide.slug }))
}

export async function generateMetadata({ params }: PageProps<"/[countryCode]/learn/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const peptide = getPeptide(slug)
  return peptide
    ? { title: `${peptide.name}: what it is and what the research shows`, description: peptide.oneLiner }
    : { title: "Not found" }
}

export default function PeptidePage({ params }: PageProps<"/[countryCode]/learn/[slug]">) {
  return (
    <Suspense fallback={<Skeleton variant="rectangular" height={640} />}>
      <PeptideProfilePage params={params} />
    </Suspense>
  )
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box component="section" sx={{ pt: { xs: 4, md: 5 }, mt: { xs: 4, md: 5 }, borderTop: "1px solid", borderColor: "divider" }}>
      <Typography component="h2" sx={{ fontSize: { xs: 24, md: 28 }, fontWeight: 600, letterSpacing: "-.03em", mb: 2 }}>{title}</Typography>
      {children}
    </Box>
  )
}

const prose = { color: "text.secondary", fontSize: 17, lineHeight: 1.8, maxWidth: 720 }

async function PeptideProfilePage({ params }: Pick<PageProps<"/[countryCode]/learn/[slug]">, "params">) {
  const { slug } = await params
  const peptide = getPeptide(slug)
  if (!peptide) notFound()
  const category = getCategory(peptide.category)
  const status = STATUSES[peptide.status]
  const inChart = WEIGHT_LOSS_TRIALS.some((trial) => trial.peptide === peptide.slug)
    || EMERGING_WEIGHT_RESEARCH.some((research) => research.peptide === peptide.slug)
  const articles = ARTICLES.filter((article) => article.peptides.includes(peptide.slug)).slice(0, 3)
  const related = PEPTIDES.filter((other) => other.slug !== peptide.slug)
    .sort((a, b) => Number(b.category === peptide.category) - Number(a.category === peptide.category)).slice(0, 3)
  const videos = getProfileVideoResources(peptide)

  return (
    <>
      <Box component="header" sx={{ bgcolor: "brand.paper", borderBottom: "1px solid", borderColor: "divider", px: gutter, pt: { xs: 4, md: 6 }, pb: { xs: 5, md: 7 } }}>
        <Box sx={{ maxWidth: 1360, mx: "auto", display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr .8fr" }, gap: { xs: 4, md: 7 }, alignItems: "center" }}>
          <Box>
            <Breadcrumbs aria-label="Breadcrumb" sx={{ fontSize: 13 }}>
              <AppLink href="/learn" underline="hover">Learn</AppLink>
              <AppLink href={`/learn#${category.id}`} underline="hover">{category.name}</AppLink>
            </Breadcrumbs>
            <Typography component="h1" sx={{ mt: 2.5, fontSize: { xs: 44, md: 64 }, fontWeight: 500, letterSpacing: "-.05em", lineHeight: 1.05 }}>{peptide.name}</Typography>
            {peptide.aka ? <Typography sx={{ mt: 1, color: "text.secondary", fontSize: 15 }}>Also known as {peptide.aka}</Typography> : null}
            <Typography sx={{ mt: 3, fontSize: { xs: 18, md: 20 }, lineHeight: 1.65, maxWidth: 640 }}>{peptide.oneLiner}</Typography>
            <Box sx={{ mt: 3, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
              <StatusBadge status={peptide.status} />
              {peptide.notAPeptide ? <Typography component="span" sx={{ fontSize: 13, color: "text.secondary" }}>Not a peptide, but often discussed with them</Typography> : null}
            </Box>
            <Typography sx={{ mt: 1.5, color: "text.secondary", fontSize: 14.5, lineHeight: 1.7, maxWidth: 640 }}>{peptide.statusNote}</Typography>
          </Box>
          <Box component="figure" sx={{ m: 0 }}>
            <Box sx={{ position: "relative", aspectRatio: "1 / 1", maxWidth: 440, mx: "auto", bgcolor: "#fff", border: "1px solid", borderColor: "divider", borderRadius: "14px", overflow: "hidden" }}>
              {peptide.pubchem
                ? <Image src={`/images/learn/structures/${peptide.slug}.webp`} alt={`Chemical structure of ${peptide.name}`} fill priority sizes="(max-width: 900px) 90vw, 440px" style={{ objectFit: "contain", padding: 24 }} />
                : <ArticleArt variant="triple" uid={`hero-${peptide.slug}`} sx={{ position: "absolute", inset: 0 }} />}
            </Box>
            {peptide.pubchem ? (
              <Typography component="figcaption" sx={{ mt: 1.25, fontSize: 12.5, color: "text.secondary", textAlign: "center" }}>
                Structure drawing: <Link href={`https://pubchem.ncbi.nlm.nih.gov/compound/${peptide.pubchem}`} target="_blank" rel="noopener noreferrer">PubChem</Link>
              </Typography>
            ) : null}
          </Box>
        </Box>
      </Box>

      <Section tone="white" sx={{ py: { xs: 5, md: 8 } }}>
        <Box sx={{ maxWidth: 980 }}>
          {peptide.keyResult ? (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "auto 1fr" }, gap: { xs: 1, sm: 4 }, alignItems: "center", p: { xs: 3, md: 4 }, borderRadius: "14px", bgcolor: "brand.navy", color: "#fff" }}>
              <Typography sx={{ fontSize: { xs: 52, md: 68 }, fontWeight: 600, letterSpacing: "-.04em", lineHeight: 1 }}>{peptide.keyResult.value}</Typography>
              <Box>
                <Typography sx={{ fontSize: { xs: 18, md: 20 }, fontWeight: 600 }}>{peptide.keyResult.label}</Typography>
                <Typography sx={{ mt: .5, fontSize: 14, color: "brand.onNavyMuted" }}>{peptide.keyResult.detail}</Typography>
              </Box>
            </Box>
          ) : null}

          <Block title="What it is"><Typography sx={prose}>{peptide.whatItIs}</Typography></Block>
          <Block title="How it works"><Typography sx={prose}>{peptide.howItWorks}</Typography></Block>
          <Block title="What the research found">
            <Box component="ul" sx={{ m: 0, pl: 2.5, display: "grid", gap: 1.5, ...prose }}>
              {peptide.findings.map((finding) => <li key={finding}>{finding}</li>)}
            </Box>
          </Block>
          {inChart ? <Box sx={{ mt: 4 }}><WeightLossChart highlight={peptide.slug} /></Box> : null}
          <Block title="Known risks and side effects">
            <Box component="ul" sx={{ m: 0, pl: 2.5, display: "grid", gap: 1.5, ...prose }}>
              {peptide.risks.map((risk) => <li key={risk}>{risk}</li>)}
            </Box>
          </Block>
          <Block title="Is it approved?">
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", mb: 1.5 }}><StatusBadge status={peptide.status} /><Typography sx={{ fontSize: 14.5, color: "text.secondary" }}>{status.explain}</Typography></Box>
            <Typography sx={prose}>{peptide.statusNote}</Typography>
          </Block>
        </Box>

        <Block title={`Watch: ${peptide.name} and related science`}>
          <VideoResources videos={videos.videos} connections={videos.connections} introduction={videos.introduction} />
        </Block>

        {articles.length ? (
          <Block title="In the news">
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3.5 }}>
              {articles.map((article) => <ArticleCard key={article.slug} article={article} />)}
            </Box>
          </Block>
        ) : null}

        <Block title="Sources"><SourceList sources={peptide.sources} /></Block>

        {related.length ? (
          <Block title="Related peptide profiles">
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" }, gap: 2.5 }}>
              {related.map((other) => <PeptideCard key={other.slug} peptide={other} />)}
            </Box>
          </Block>
        ) : null}

        <ResearchCatalog peptides={[peptide.slug]} />

        <Box sx={{ mt: { xs: 5, md: 7 }, pt: 3, borderTop: "1px solid", borderColor: "divider", display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: 13, color: "text.secondary", maxWidth: 760 }}>{LEARN_DISCLAIMER}</Typography>
          <AppLink href="/learn" sx={{ display: "inline-flex", alignItems: "center", gap: .75, fontSize: 14, flexShrink: 0 }}><Icon name="arrowRight" sx={{ fontSize: 16, transform: "rotate(180deg)" }} />All peptides</AppLink>
        </Box>
      </Section>
    </>
  )
}
