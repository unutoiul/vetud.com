import { getContentTranslator } from "@/i18n/server-content"
import { getTranslations } from "next-intl/server"
import Box from "@mui/material/Box"
import Link from "@mui/material/Link"
import Skeleton from "@mui/material/Skeleton"
import Typography from "@mui/material/Typography"
import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { AppLink } from "@/components/common/links"
import Section from "@/components/common/Section"
import PeptideCommunity from "@/components/community/PeptideCommunity"
import ArticleCard from "@/components/learn/ArticleCard"
import PeptideCard from "@/components/learn/PeptideCard"
import GuideShopLink from "@/components/learn/GuideShopLink"
import { ArticleJsonLd, ReadingHeader, ReadingLayout, ReadingSection, readingProse } from "@/components/learn/ReadingLayout"
import SourceList, { LEARN_DISCLAIMER } from "@/components/learn/SourceList"
import EvidenceLadder from "@/components/learn/EvidenceLadder"
import StatusBadge from "@/components/learn/StatusBadge"
import StudyResults from "@/components/learn/StudyResults"
import VideoResources from "@/components/learn/VideoResources"
import WeightLossChart from "@/components/learn/WeightLossChart"
import { ARTICLES } from "@/content/learn/articles"
import { EMERGING_WEIGHT_RESEARCH } from "@/content/learn/emerging-weight-research"
import { getCategory, STATUSES } from "@/content/learn/categories"
import { getLearnIllustration } from "@/content/learn/illustrations"
import { getPeptide, PEPTIDES } from "@/content/learn/peptides"
import { getProfileVideoResources } from "@/content/learn/video-resources"
import { WEIGHT_LOSS_TRIALS } from "@/content/learn/weight-loss-trials"
import { articleMetadata, articleStructuredData, readingMinutes } from "@/lib/article-seo"
import { guideProductUrl } from "@/lib/guide-products"

export function generateStaticParams() {
  return PEPTIDES.map(peptide => ({ slug: peptide.slug }))
}

export async function generateMetadata({ params }: PageProps<"/[lang]/learn/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const peptide = getPeptide(slug)
  return peptide ? articleMetadata({
    title: `${peptide.name}: research, risks and approval status`, description: peptide.oneLiner,
    path: `/learn/${peptide.slug}`, image: getLearnIllustration(peptide.slug),
  }) : { title: "Not found", robots: { index: false } }
}

export default function PeptidePage({ params }: PageProps<"/[lang]/learn/[slug]">) {
  return <Suspense fallback={<Skeleton variant="rectangular" height={640} />}><PeptideProfilePage params={params} /></Suspense>
}

async function PeptideProfilePage({ params }: Pick<PageProps<"/[lang]/learn/[slug]">, "params">) {
  const ct = await getContentTranslator()
  const act = await getTranslations("Actions")
  const { slug } = await params
  const peptide = getPeptide(slug)
  if (!peptide) notFound()
  const category = getCategory(peptide.category)
  const status = STATUSES[peptide.status]
  const image = getLearnIllustration(peptide.slug)
  const title = `${peptide.name}: what the research shows`
  const inChart = WEIGHT_LOSS_TRIALS.some(trial => trial.peptide === peptide.slug)
    || EMERGING_WEIGHT_RESEARCH.some(research => research.peptide === peptide.slug)
  const articles = ARTICLES.filter(article => article.peptides.includes(peptide.slug)).slice(0, 3)
  const related = PEPTIDES.filter(other => other.slug !== peptide.slug)
    .sort((a, b) => Number(b.category === peptide.category) - Number(a.category === peptide.category)).slice(0, 3)
  const videos = getProfileVideoResources(peptide)
  const unknowns = peptide.unknowns ?? []
  const text = [peptide.oneLiner, peptide.whatItIs, peptide.howItWorks, ...peptide.findings, ...unknowns, ...peptide.risks, peptide.statusNote]
  const contents = [
    { id: "at-a-glance", label: "At a glance" },
    { id: "what-it-is", label: act("whatIsPeptide", { peptide: ct(peptide.name) }) },
    { id: "how-it-works", label: "How it works" },
    { id: "research", label: "Research findings" },
    ...(inChart ? [{ id: "comparison", label: "Weight-loss comparison" }] : []),
    ...(unknowns.length ? [{ id: "unknowns", label: "What we don't know yet" }] : []),
    { id: "risks", label: "Risks and side effects" },
    { id: "approval", label: "Approval status" },
    { id: "community", label: "From the community" },
    { id: "videos", label: "Watch and learn" },
    { id: "sources", label: "Sources and references" },
    ...(guideProductUrl(peptide.slug) ? [{ id: "research-shop", label: "Laboratory research material" }] : []),
  ]
  const data = await articleStructuredData({
    title, description: peptide.oneLiner, path: `/learn/${peptide.slug}`, image, sources: peptide.sources, text,
    breadcrumbs: [{ name: "Home", path: "" }, { name: "Education", path: "/learn" }, { name: category.name, path: `/learn#${category.id}` }, { name: peptide.name, path: `/learn/${peptide.slug}` }],
  })

  return <>
    <Box component="article" lang={ct.locale} aria-labelledby="article-title">
      <ArticleJsonLd data={data} />
      <ReadingHeader title={ct(title)} description={ct(peptide.oneLiner)} image={image} uid={`hero-${peptide.slug}`} minutes={readingMinutes(text)}
        breadcrumbs={[{ label: "Education", href: "/learn" }, { label: category.name, href: `/learn#${category.id}` }, { label: peptide.name }]}
        meta={<><StatusBadge status={peptide.status} /><span>{ct("Research guide")}</span></>}>
        {peptide.aka ? <Typography sx={{ mt: 1.5, color: "brand.navySoft", fontSize: 14 }}>{ct.rich("Also known as {v0}", { v0: ct(peptide.aka) }, {  })}</Typography> : null}
      </ReadingHeader>

      <ReadingLayout items={contents}>
        <ReadingSection id="at-a-glance" title={ct("At a glance")} first>
          <Box sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "brand.mintWash", borderLeft: "3px solid", borderColor: "brand.blue", borderRadius: "0 8px 8px 0" }}>
            {peptide.keyResult ? <>
              <Typography sx={{ fontSize: { xs: 26, md: 30 }, fontWeight: 700, lineHeight: 1.25, color: "brand.navy", overflowWrap: "break-word" }}>{ct(peptide.keyResult.value)}</Typography>
              <Typography sx={{ mt: 1, fontSize: 18, fontWeight: 600, color: "brand.navy" }}>{ct(peptide.keyResult.label)}</Typography>
              <Typography sx={{ mt: 1, fontSize: 14, lineHeight: 1.7, color: "brand.navySoft" }}>{ct(peptide.keyResult.detail)}</Typography>
            </> : null}
            <Typography sx={{ ...readingProse, mt: peptide.keyResult ? 2 : 0, fontSize: 16 }}>{ct(peptide.statusNote)}</Typography>
            {peptide.notAPeptide ? <Typography sx={{ mt: 1.5, fontSize: 14, fontWeight: 650, color: "brand.navy" }}>{ct("This compound is not a peptide, but is often discussed alongside them.")}</Typography> : null}
          </Box>
          {peptide.evidence ? <Box sx={{ mt: 3 }}><EvidenceLadder evidence={peptide.evidence} name={peptide.name} /></Box> : null}
        </ReadingSection>

        <ReadingSection id="what-it-is" title={ct.template("What is {v0}?", { v0: peptide.name })}><Typography sx={readingProse}>{ct(peptide.whatItIs)}</Typography></ReadingSection>
        <ReadingSection id="how-it-works" title={ct.template("How does {v0} work?", { v0: peptide.name })}>
          <Typography sx={readingProse}>{ct(peptide.howItWorks)}</Typography>
          {peptide.pubchem ? <Box component="details" sx={{ mt: 2.5, p: 2, border: "1px solid", borderColor: "divider", borderRadius: "8px", "& summary": { cursor: "pointer", minHeight: 44, alignContent: "center", color: "brand.blue", fontSize: 15, fontWeight: 600 } }}>
            <summary>{ct("View the chemical structure")}</summary>
            <Box sx={{ position: "relative", height: 300, mt: 2 }}><Image src={`/images/learn/structures/${peptide.slug}.webp`} alt={ct.template("Chemical structure of {v0}, from PubChem", { v0: peptide.name })} fill sizes="(max-width: 600px) 85vw, 600px" style={{ objectFit: "contain" }} /></Box>
            <Link href={`https://pubchem.ncbi.nlm.nih.gov/compound/${peptide.pubchem}`} target="_blank" rel="noopener noreferrer" sx={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 14 }}>{act("chemicalSource")}</Link>
          </Box> : null}
        </ReadingSection>
        <ReadingSection id="research" title={ct("What does the research show?")}>
          {peptide.results?.length ? <Box sx={{ mb: 3 }}><StudyResults results={peptide.results} sources={peptide.sources} /></Box> : null}
          <Box component="ul" sx={{ ...readingProse, m: 0, pl: 2.5, display: "grid", gap: 2, "& li::marker": { color: "brand.blue" } }}>{peptide.findings.map(finding => <li key={finding}>{ct(finding)}</li>)}</Box>
          <AppLink href="#sources" sx={{ mt: 2, display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 15 }}>{act("readStudies")}</AppLink>
        </ReadingSection>
        {inChart ? <ReadingSection id="comparison" title={ct("How do the weight-loss results compare?")}><WeightLossChart highlight={peptide.slug} /></ReadingSection> : null}
        {unknowns.length ? <ReadingSection id="unknowns" title={ct("What we don't know yet")}>
          <Box component="ul" sx={{ ...readingProse, m: 0, pl: 2.5, display: "grid", gap: 2, "& li::marker": { color: "brand.blue" } }}>{unknowns.map(item => <li key={item}>{ct(item)}</li>)}</Box>
        </ReadingSection> : null}
        <ReadingSection id="risks" title={ct("Known risks and side effects")}>
          <Box component="ul" sx={{ ...readingProse, m: 0, pl: 2.5, display: "grid", gap: 2, "& li::marker": { color: "brand.blue" } }}>{peptide.risks.map(risk => <li key={risk}>{ct(risk)}</li>)}</Box>
        </ReadingSection>
        <ReadingSection id="approval" title={ct.template("Is {v0} approved?", { v0: peptide.name })}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, mb: 2 }}><StatusBadge status={peptide.status} /><Typography sx={{ fontSize: 15, color: "brand.navySoft" }}>{ct(status.explain)}</Typography></Box>
          <Typography sx={readingProse}>{ct(peptide.statusNote)}</Typography>
        </ReadingSection>
        <ReadingSection id="community" title={ct("From the community")}>
          <Suspense fallback={<Skeleton variant="rounded" height={220} />}><PeptideCommunity peptide={peptide} /></Suspense>
        </ReadingSection>
        <ReadingSection id="videos" title={ct.template("Watch: {v0} and related science", { v0: peptide.name })}><VideoResources videos={videos.videos} connections={videos.connections} introduction={videos.introduction} /></ReadingSection>
        <ReadingSection id="sources" title={ct("Sources and references")}>
          <SourceList sources={peptide.sources} />
          <Typography sx={{ mt: 3, fontSize: 14, lineHeight: 1.8, color: "brand.navySoft" }}>{ct(LEARN_DISCLAIMER)}</Typography>
        </ReadingSection>
        <GuideShopLink slug={peptide.slug} name={peptide.name} />
      </ReadingLayout>
    </Box>

    <Section tone="paper" sx={{ py: { xs: 5, md: 7 }, borderTop: "1px solid", borderColor: "divider" }}>
      {articles.length ? <Box sx={{ mb: { xs: 5, md: 7 } }}>
        <Typography component="h2" sx={{ fontSize: { xs: 25, md: 30 }, fontWeight: 650, mb: 3, color: "brand.navy" }}>{ct.rich("More about {v0}", { v0: ct(peptide.name) }, {  })}</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 4 }}>{articles.map(article => <ArticleCard key={article.slug} article={article} />)}</Box>
      </Box> : null}
      <Typography component="h2" sx={{ fontSize: { xs: 25, md: 30 }, fontWeight: 650, mb: 3, color: "brand.navy" }}>{ct("Continue exploring")}</Typography>
      <Suspense fallback={<Skeleton height={360} />}><RelatedProfiles slugs={related.map(other => other.slug)} /></Suspense>
      <AppLink href="/learn" sx={{ mt: 3, display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 15 }}>{act("peptideLibrary")}</AppLink>
    </Section>
  </>
}

function RelatedProfiles({ slugs }: { slugs: string[] }) {
  return <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, minmax(0, 1fr))" }, gap: 3 }}>{slugs.map(slug => {
    const peptide = getPeptide(slug)
    return peptide ? <PeptideCard key={slug} peptide={peptide} /> : null
  })}</Box>
}
