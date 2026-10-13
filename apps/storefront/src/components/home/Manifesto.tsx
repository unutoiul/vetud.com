import Box from "@mui/material/Box"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import Icon from "../brand/Icon"
import { LogoMark } from "../brand/Logo"
import { ButtonLink } from "../common/links"
import Section from "../common/Section"

export default function Manifesto() {
  return <Section tone="paper" tight>
    <Box sx={{ bgcolor: "#e7eef2", p: .75, borderRadius: 5 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={4} sx={{ borderRadius: 4.25, bgcolor: "brand.navy", color: "brand.onNavy", p: { xs: 4, md: 6 }, justifyContent: "space-between", alignItems: { md: "center" } }}>
        <Stack direction="row" spacing={3} sx={{ alignItems: "center", maxWidth: 750 }}>
          <Box sx={{ display: { xs: "none", sm: "block" } }}><LogoMark size={68} tone="light" /></Box>
          <Box><Typography sx={{ fontSize: 12, color: "brand.onNavyMuted", mb: 1.5 }}>The VETUD philosophy</Typography><Typography component="h2" sx={{ fontSize: { xs: 29, md: 36 }, fontWeight: 450, letterSpacing: "-.045em", lineHeight: 1.25 }}>Clarity is part of the science.</Typography><Typography sx={{ mt: 1.5, color: "brand.onNavyMuted", fontSize: 14 }}>Better information. Thoughtful materials. A more considered standard.</Typography></Box>
        </Stack>
        <ButtonLink href="/standards" variant="contained" color="mint" endIcon={<Icon name="arrowUpRight" />} sx={{ flexShrink: 0, alignSelf: { xs: "flex-start", md: "center" } }}>Discover our approach</ButtonLink>
      </Stack>
    </Box>
  </Section>
}
