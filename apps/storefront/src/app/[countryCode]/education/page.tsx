import type { Metadata } from "next"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Icon, { type IconName } from "@/components/brand/Icon"
import { AppLink, ButtonLink } from "@/components/common/links"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import PeptideVideos from "@/components/education/PeptideVideos"

export const metadata: Metadata = { title: "Education", description: "A plain-language guide to peptides, mg and ml, how research materials are supplied, and purity information." }

const TOPICS: { title: string; icon: IconName; paragraphs: string[]; source?: { label: string; href: string } }[] = [
  { title: "What is a peptide?", icon: "molecule", paragraphs: ["A peptide is a short chain of amino acids, joined by peptide bonds. Amino acids also form the longer chains found in proteins.", "A peptide's name identifies the molecule. It does not tell you its amount, formulation or whether a finished product is an approved medicine."], source: { label: "Read the NHGRI peptide glossary", href: "https://www.genome.gov/genetics-glossary/Peptide" } },
  { title: "mg and ml measure different things.", icon: "sliders", paragraphs: ["Milligrams (mg) measure mass. Millilitres (ml) measure liquid volume. A 10 mg vial and a 10 ml bottle describe different quantities, so the numbers cannot be compared directly.", "Concentration connects the two: mg/ml means the mass of an ingredient in each millilitre. Volume alone does not reveal peptide concentration."] },
  { title: "How research materials are supplied.", icon: "package", paragraphs: ["Research peptides are commonly supplied as freeze-dried (lyophilized) powder in sealed vials. The form describes how the material is supplied; it does not establish a shelf life or storage temperature.", "Use the storage conditions and expiry date shown on the label and in the lot documentation. Each product page lists the amount, form and storage conditions."] },
  { title: "Read purity in context.", icon: "flask", paragraphs: ["A purity percentage describes a testing result for a specific lot. It does not, by itself, establish concentration or suitability for any particular experiment. Ask for the relevant batch documentation when assessing a material.", "Product information here explains specifications and formats for laboratory research. It is not dosing, usage or treatment guidance."] },
]

export default function EducationPage() {
  return <>
    <PageHeader eyebrow="Education" title="Peptide science, made clear." description="A guide to the terms behind the collection—from amounts and formats to purity information." />
    <PeptideVideos />
    <Section tone="white" sx={{ py: { xs: 5, md: 8 } }}><Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 5, md: 7 } }}>{TOPICS.map((topic, index) => <Box component="article" key={topic.title} sx={{ borderTop: "1px solid", borderColor: "divider", pt: 3 }}><Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}><Icon name={topic.icon} sx={{ color: "brand.blue", fontSize: 28 }} /><Typography variant="mono" sx={{ color: "text.secondary" }}>{String(index + 1).padStart(2, "0")}</Typography></Box><Typography component="h2" variant="h4" sx={{ mb: 2 }}>{topic.title}</Typography>{topic.paragraphs.map((paragraph) => <Typography key={paragraph} sx={{ color: "text.secondary", mb: 2, lineHeight: 1.9 }}>{paragraph}</Typography>)}{topic.source && <AppLink href={topic.source.href} target="_blank" rel="noopener noreferrer" sx={{ fontSize: 12 }}>{topic.source.label}</AppLink>}</Box>)}</Box><Box sx={{ mt: 7 }}><ButtonLink href="/shop" variant="contained" endIcon={<Icon name="arrowUpRight" />}>Browse the Peptide Series</ButtonLink></Box></Section>
  </>
}
