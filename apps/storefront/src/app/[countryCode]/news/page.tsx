import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import type { Metadata } from "next"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import ArticleCard from "@/components/learn/ArticleCard"
import { LEARN_DISCLAIMER } from "@/components/learn/SourceList"
import { ARTICLES } from "@/content/learn/articles"

export const metadata: Metadata = {
  title: "News & articles",
  description: "Peptide research, regulation and learning guides, with connected videos and original sources.",
}

export default function NewsPage() {
  const [latest, ...rest] = ARTICLES
  return (
    <>
      <PageHeader eyebrow="News" title="News & articles." description="Research, regulation and learning guides, explained in plain language. Every article has connected videos and source links." />
      <Section tone="white" sx={{ py: { xs: 5, md: 8 } }}>
        {latest ? <Box sx={{ maxWidth: 1040 }}><ArticleCard article={latest} featured /></Box> : null}
        <Box sx={{ mt: { xs: 6, md: 8 }, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" }, columnGap: 3.5, rowGap: { xs: 5, md: 6 } }}>
          {rest.map((article) => <ArticleCard key={article.slug} article={article} />)}
        </Box>
        <Typography sx={{ mt: { xs: 6, md: 8 }, pt: 3, borderTop: "1px solid", borderColor: "divider", fontSize: 13, color: "text.secondary", maxWidth: 820 }}>{LEARN_DISCLAIMER}</Typography>
      </Section>
    </>
  )
}
