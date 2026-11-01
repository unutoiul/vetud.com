import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import Skeleton from "@mui/material/Skeleton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { AppLink } from "@/components/common/links"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import { getLegalDocument, LEGAL_DOCUMENTS } from "@/content/legal"

export function generateStaticParams() {
  return LEGAL_DOCUMENTS.map((document) => ({ slug: document.slug }))
}

export async function generateMetadata({ params }: PageProps<"/[countryCode]/legal/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const document = getLegalDocument(slug)
  return document ? { title: document.title, description: document.summary } : { title: "Not found" }
}

export default function LegalPage({ params }: PageProps<"/[countryCode]/legal/[slug]">) {
  return (
    <Suspense fallback={<Skeleton variant="rectangular" height={480} />}>
      <LegalContent params={params} />
    </Suspense>
  )
}

async function LegalContent({ params }: Pick<PageProps<"/[countryCode]/legal/[slug]">, "params">) {
  const { slug } = await params
  const document = getLegalDocument(slug)
  if (!document) notFound()

  return (
    <>
      <PageHeader eyebrow={`Legal · Last updated ${document.updated}`} title={document.title} description={document.summary} />
      <Section tone="white">
        <Grid container spacing={{ xs: 4, md: 8 }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Stack component="nav" aria-label="Legal documents" spacing={0.5} sx={{ bgcolor: "#f7f9fa", border: "1px solid", borderColor: "divider", borderRadius: 3, p: 2.5, position: { md: "sticky" }, top: { md: 110 } }}>
              {LEGAL_DOCUMENTS.map((item) => (
                <AppLink
                  key={item.slug}
                  href={`/legal/${item.slug}`}
                  aria-current={item.slug === document.slug ? "page" : undefined}
                  sx={{
                    color: item.slug === document.slug ? "secondary.main" : "text.secondary",
                    fontWeight: item.slug === document.slug ? 700 : 500,
                    fontSize: 15,
                    py: 1,
                    px: 1.5,
                    borderRadius: 1.5,
                    bgcolor: item.slug === document.slug ? "#eff5f6" : "transparent",
                  }}
                >
                  {item.title}
                </AppLink>
              ))}
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 9 }}>
            <Box component="article" sx={{ maxWidth: 760, overflowWrap: "anywhere" }}>
              {document.sections.map((section) => (
                <Box key={section.heading} component="section" sx={{ mb: 4 }}>
                  <Typography variant="h5" component="h2" sx={{ mb: 1.5 }}>
                    {section.heading}
                  </Typography>
                  {section.paragraphs.map((paragraph) => (
                    <Typography key={paragraph.slice(0, 40)} sx={{ mb: 1.5, color: "text.primary" }}>
                      {paragraph}
                    </Typography>
                  ))}
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Section>
    </>
  )
}
