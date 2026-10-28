import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Icon from "../brand/Icon"
import { ButtonLink } from "../common/links"
import Section from "../common/Section"

const principles = [
  { number: "01", title: "Understand the material.", text: "Product form, available amounts, ingredients and storage information. The details you need, in one place." },
  { number: "02", title: "Look beyond the label.", text: "Explore the research background and follow the original scientific publications. Keep evidence and product specifications in context." },
  { number: "03", title: "Follow the lot.", text: "Match your material to its lot record. Download a published certificate or request the documentation directly from our team." },
]

export default function ResearchStandard() {
  return <Section tone="wash" sx={{ borderTop: "1px solid", borderBottom: "1px solid", borderColor: "divider" }}>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: ".85fr 1.15fr" }, gap: { xs: 5, md: 12 } }}>
      <Box>
        <Typography variant="mono" component="p" sx={{ color: "brand.blue", fontSize: 10, letterSpacing: ".15em", textTransform: "uppercase" }}>02 / The VETUD standard</Typography>
        <Typography component="h2" variant="h2" sx={{ mt: 2.5, maxWidth: 460, fontWeight: 400 }}>Confidence begins<br />with clarity.</Typography>
        <Typography sx={{ mt: 2.5, color: "text.secondary", maxWidth: 390, fontSize: 14 }}>Good research starts with knowing your materials. We make the information easier to find, read and verify.</Typography>
        <ButtonLink href="/documentation" variant="outlined" endIcon={<Icon name="arrowUpRight" />} sx={{ mt: 3.5 }}>Explore lab documentation</ButtonLink>
      </Box>
      <Box>{principles.map((item) => <Box key={item.number} sx={{ display: "flex", gap: 3, py: 3, borderTop: "1px solid", borderColor: "brand.lineStrong", "&:first-of-type": { pt: 0, borderTop: 0 } }}><Typography variant="mono" sx={{ color: "brand.blue", fontSize: 10, pt: .8 }}>{item.number}</Typography><Box><Typography component="h3" sx={{ fontSize: 23, letterSpacing: "-.03em", fontWeight: 500 }}>{item.title}</Typography><Typography sx={{ color: "text.secondary", mt: 1, maxWidth: 550, fontSize: 14, lineHeight: 1.85 }}>{item.text}</Typography></Box></Box>)}</Box>
    </Box>
  </Section>
}
