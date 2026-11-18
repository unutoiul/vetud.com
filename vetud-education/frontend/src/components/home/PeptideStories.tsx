import Image from "next/image"
import { getLearnIllustration } from "@/content/learn/illustrations"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { getContentTranslator } from "@/i18n/server-content"
import { brand } from "@/theme/tokens"
import Icon from "../brand/Icon"
import { AppLink } from "../common/links"
import Section from "../common/Section"

const sourceSx = { display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 12, textUnderlineOffset: 4 }

export default async function PeptideStories() {
  const ct = await getContentTranslator()
  const exenatide = getLearnIllustration("exenatide")
  return <Section id="peptide-stories" aria-labelledby="stories-heading" tone="white" sx={{ py: { xs: 6, md: 9 }, scrollMarginTop: 100 }}>
    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", gap: 2, mb: 4 }}>
      <Typography id="stories-heading" component="h2" variant="h2" sx={{ maxWidth: 630 }}>{ct("The science is full of surprises.")}</Typography>
      <Typography sx={{ maxWidth: 390, alignSelf: { md: "flex-end" }, color: "text.secondary", fontSize: 16 }}>{ct("A desert lizard. A Nobel Prize. Two tiny changes. Follow the stories that make these molecules so fascinating.")}</Typography>
    </Box>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) minmax(0, 1fr)" }, gap: 2.5 }}>
      <Box component="article" sx={{ position: "relative", overflow: "hidden", bgcolor: brand.navy, color: brand.onNavy, borderRadius: "20px", p: { xs: 3, sm: 4 }, display: "flex", flexDirection: "column", "& :focus-visible": { outlineColor: brand.cyan } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: 13, color: brand.cyan }}><Icon name="leaf" sx={{ fontSize: 18 }} />{ct("An unexpected origin")}</Box>
        {exenatide && <Box sx={{ position: "relative", overflow: "hidden", borderRadius: "12px", width: "100%", aspectRatio: "2 / 1", my: 2 }}>
          <Image src={exenatide.src} alt="" fill sizes="(min-width: 900px) 550px, 92vw" style={{ objectFit: "cover" }} />
        </Box>}
        <Typography component="h3" sx={{ fontSize: { xs: 29, sm: 36 }, fontWeight: 500, lineHeight: 1.15, letterSpacing: "-.04em", maxWidth: 480 }}>{ct("A lizard helped inspire a diabetes medicine.")}</Typography>
        <Typography sx={{ mt: 2, color: brand.onNavyMuted, fontSize: 15, lineHeight: 1.8 }}>{ct("Researchers found exendin-4 in the Gila monster. A synthetic version became exenatide, a medicine for type 2 diabetes. An unlikely animal helped open a new chapter in hormone research.")}</Typography>
        <Box sx={{ mt: "auto", pt: 2, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <AppLink href="/learn/exenatide" sx={{ ...sourceSx, color: brand.onNavy, fontSize: 14, fontWeight: 600 }}>{ct("Explore the GLP-1 story")}</AppLink>
          <Box component="a" href="https://www.niddk.nih.gov/news/archive/2021/story-discovery-medications-diabetes-obesity-emerged-research-pancreatic-hormone" target="_blank" rel="noopener noreferrer" sx={{ ...sourceSx, color: brand.onNavyMuted }}>{ct("Source: NIDDK")}</Box>
        </Box>
      </Box>

      <Box sx={{ display: "grid", gap: 2.5 }}>
        <Box component="article" sx={{ bgcolor: brand.mintLight, borderRadius: "20px", p: { xs: 3, sm: 3.5 }, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "110px minmax(0, 1fr)" }, gap: { xs: 1.5, sm: 3 } }}>
          <Box><Typography sx={{ fontSize: { xs: 44, sm: 48 }, color: brand.blue, fontWeight: 400, letterSpacing: "-.06em", lineHeight: 1 }}>{ct("1958")}</Typography><Typography sx={{ fontSize: 12, color: brand.navySoft, mt: 1 }}>{ct("Nobel Prize in Chemistry")}</Typography></Box>
          <Box>
            <Typography component="h3" sx={{ fontSize: 25, fontWeight: 500, letterSpacing: "-.035em", lineHeight: 1.2 }}>{ct("Insulin helped scientists read proteins.")}</Typography>
            <Typography sx={{ mt: 1.5, fontSize: 14, color: brand.navySoft, lineHeight: 1.75 }}>{ct("Frederick Sanger worked out the order of insulin’s 51 amino acids. It was the first protein sequence to be determined, a breakthrough recognised with the 1958 Nobel Prize.")}</Typography>
            <Box component="a" href="https://mrclmb.ac.uk/achievements/awards-and-prizes/nobel-prizes/1958-fred-sanger/" target="_blank" rel="noopener noreferrer" sx={{ ...sourceSx, mt: 1, color: brand.navy }}>{ct("Source: MRC Laboratory of Molecular Biology")}</Box>
          </Box>
        </Box>
        <Box component="article" sx={{ border: "1px solid", borderColor: brand.lineStrong, borderRadius: "20px", p: { xs: 3, sm: 3.5 } }}>
          <Box aria-hidden="true" sx={{ display: "flex", gap: 1, mb: 2 }}>{Array.from({ length: 9 }, (_, i) => <Box key={i} sx={{ width: { xs: 18, sm: 24 }, height: { xs: 18, sm: 24 }, borderRadius: "50%", bgcolor: i === 2 || i === 7 ? brand.blue : brand.mint, border: "1px solid", borderColor: i === 2 || i === 7 ? brand.blue : brand.lineStrong }} />)}</Box>
          <Typography component="h3" sx={{ fontSize: 25, fontWeight: 500, letterSpacing: "-.035em", lineHeight: 1.2 }}>{ct("Two building blocks. Very different messages.")}</Typography>
          <Typography sx={{ mt: 1.5, fontSize: 14, color: brand.navySoft, lineHeight: 1.75 }}>{ct("Oxytocin and vasopressin each contain nine amino acids and differ at just two positions. Yet one is central to childbirth and milk release, while the other helps regulate the body’s water balance.")}</Typography>
          <Box component="a" href="https://www.ncbi.nlm.nih.gov/books/NBK279157/" target="_blank" rel="noopener noreferrer" sx={{ ...sourceSx, mt: 1, color: brand.navy }}>{ct("Source: Endotext / NCBI Bookshelf")}</Box>
        </Box>
      </Box>
    </Box>
  </Section>
}
