import NorthEastIcon from "@mui/icons-material/NorthEast"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { ButtonLink } from "../common/links"
import Section from "../common/Section"
import { SerifAccent } from "../common/SectionHeading"

export default function Manifesto() {
  return (
    <Section tone="navy" tight sx={{ bgcolor: "#0d3546" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 3, md: 6 }}
        sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}
      >
        <Typography variant="eyebrow" sx={{ color: "#84d6cd", whiteSpace: "nowrap" }}>
          A note from Vetud
        </Typography>
        <Typography
          component="blockquote"
          sx={{ m: 0, fontSize: { xs: 26, md: 34 }, letterSpacing: "-0.035em", lineHeight: 1.25, maxWidth: 680, color: "#eaf8f1" }}
        >
          “Clarity is not an extra step. It is part of the <SerifAccent color="#75d0c4">science.</SerifAccent>”
        </Typography>
        <ButtonLink
          href="/standards"
          variant="outlined"
          size="small"
          endIcon={<NorthEastIcon />}
          sx={{ color: "#a6c2c5", borderColor: "#376271", borderRadius: 999, whiteSpace: "nowrap", alignSelf: { xs: "flex-start", md: "center" } }}
        >
          Meet Vetud
        </ButtonLink>
      </Stack>
    </Section>
  )
}
