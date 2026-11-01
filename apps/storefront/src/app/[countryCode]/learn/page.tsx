import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import type { Metadata } from "next"
import Image from "next/image"
import Icon, { type IconName } from "@/components/brand/Icon"
import { ButtonLink } from "@/components/common/links"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import SectionHeading from "@/components/common/SectionHeading"
import ArticleCard from "@/components/learn/ArticleCard"
import LearnLibrary from "@/components/learn/LearnLibrary"
import { LEARN_DISCLAIMER } from "@/components/learn/SourceList"
import VideoGallery from "@/components/learn/VideoGallery"
import WeightLossChart from "@/components/learn/WeightLossChart"
import { ARTICLES, LEARNING_GUIDES } from "@/content/learn/articles"
import { PEPTIDES } from "@/content/learn/peptides"
import { getVideos, VIDEOS } from "@/content/learn/videos"

const PROFILE_COUNT = PEPTIDES.length

export const metadata: Metadata = {
  title: "Learn: peptides explained simply",
  description: `Plain-language guides to ${PROFILE_COUNT} peptides and related compounds, from approved medicines to early research: what they are, what studies found, approval status and known risks.`,
}

const BASICS: { title: string; icon: IconName; text: string }[] = [
  { title: "What is a peptide?", icon: "molecule", text: "A short chain of amino acids, the same building blocks that make up proteins. Insulin, oxytocin and the new weight-loss medicines are all peptides." },
  { title: "Approved or not?", icon: "shield", text: "An approved medicine has passed large trials and been checked by a regulator such as the FDA. Many popular peptides have only been tested in cells or animals. Every page here says which is which." },
  { title: "Reading a result", icon: "scale", text: "Results are averages from trials. A placebo group, which gets a dummy treatment, shows how much change happens anyway. The difference between the two is what the medicine did." },
  { title: "mg and ml", icon: "sliders", text: "Milligrams (mg) measure weight. Millilitres (ml) measure liquid. A 10 mg vial and a 10 ml bottle are different things, and can’t be compared directly." },
]

export default function LearnPage() {
  return (
    <>
      <PageHeader eyebrow="Learn" title="Peptides, explained simply." description={`Plain-language guides to ${PROFILE_COUNT} peptides and related compounds, from approved medicines to early research. What they are, what studies found, how far they’ve got, and what’s still unknown.`} />

      <Section tone="white" id="library" sx={{ py: { xs: 5, md: 8 } }}>
        <LearnLibrary />
      </Section>

      <Section tone="paper" sx={{ py: { xs: 6, md: 9 } }}>
        <SectionHeading eyebrow="Results" title="What the weight-loss trials found." description="Published human trial averages, plus early findings for PTT-A and CBL-514 with the type of evidence clearly identified." />
        <WeightLossChart />
      </Section>

      <Section tone="white" sx={{ py: { xs: 6, md: 9 } }}>
        <SectionHeading eyebrow="Learning guides" title="Make sense of the evidence." description="Start with the research stages, then learn how to compare the results a study actually measured." />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 4, md: 3.5 }, mb: { xs: 7, md: 9 } }}>
          {LEARNING_GUIDES.map(article => <ArticleCard key={article.slug} article={article} />)}
        </Box>
        <SectionHeading eyebrow="News & articles" title="New research, explained." description="Recent studies and decisions, written so anyone can follow them, with every source linked." action={<ButtonLink href="/news" variant="outlined" endIcon={<Icon name="arrowRight" />}>All articles</ButtonLink>} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: { xs: 4, md: 3.5 } }}>
          {ARTICLES.filter(article => article.kind !== "Guide").slice(0, 3).map((article) => <ArticleCard key={article.slug} article={article} />)}
        </Box>
      </Section>

      <Section tone="paper" sx={{ py: { xs: 6, md: 9 } }}>
        <SectionHeading eyebrow="Videos" title="Watch, then explore the evidence." description={`${VIDEOS.length} selected YouTube videos from clinicians, researchers, hospitals and science educators. Each profile and article has its own connected selection.`} action={<ButtonLink href="/videos" variant="outlined" endIcon={<Icon name="arrowRight" />}>All videos</ButtonLink>} />
        <VideoGallery videos={getVideos(["KeqMSzFbSos", "9dS7bc_2bUE", "lJOQB_G15Jc"])} />
      </Section>

      <Section tone="white" sx={{ py: { xs: 6, md: 9 } }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 4, md: 7 }, alignItems: "center" }}>
          <Box component="figure" sx={{ m: 0 }}>
            <Box sx={{ position: "relative", aspectRatio: "16 / 10", borderRadius: "10px", overflow: "hidden" }}>
              <Image src="/images/learn/lab-vial-filling.webp" alt="A technician in a cleanroom suit loads a tray of small glass vials onto a filling machine" fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: "cover" }} />
            </Box>
            <Typography component="figcaption" sx={{ mt: 1.25, fontSize: 13, color: "text.secondary" }}>Peptide vials being filled in a cleanroom.</Typography>
          </Box>
          <Box>
            <Typography variant="h2" component="h2" sx={{ fontSize: { xs: 34, md: 44 } }}>The basics.</Typography>
            <Box sx={{ mt: 3, display: "grid", gap: 3 }}>
              {BASICS.map((item) => (
                <Box key={item.title} sx={{ display: "grid", gridTemplateColumns: "36px 1fr", gap: 2 }}>
                  <Icon name={item.icon} sx={{ fontSize: 26, color: "brand.blue", mt: .25 }} />
                  <Box>
                    <Typography component="h3" sx={{ fontSize: 18, fontWeight: 650 }}>{item.title}</Typography>
                    <Typography sx={{ color: "text.secondary", mt: .5, lineHeight: 1.75 }}>{item.text}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
        <Typography sx={{ mt: { xs: 5, md: 7 }, pt: 3, borderTop: "1px solid", borderColor: "divider", fontSize: 13, color: "text.secondary", maxWidth: 820 }}>{LEARN_DISCLAIMER}</Typography>
      </Section>
    </>
  )
}
