import NorthEastIcon from "@mui/icons-material/NorthEast"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { ButtonLink } from "@/components/common/links"
import Section from "@/components/common/Section"
import { SerifAccent } from "@/components/common/SectionHeading"

export default function NotFound() {
  return (
    <Section>
      <Stack spacing={3} sx={{ alignItems: "flex-start", maxWidth: 640, py: { md: 6 } }}>
        <Typography variant="eyebrow" sx={{ color: "secondary.main" }}>
          Error 404
        </Typography>
        <Typography variant="h2" component="h1">
          This sequence is <SerifAccent>not on file.</SerifAccent>
        </Typography>
        <Typography sx={{ color: "text.secondary" }}>
          The page you were looking for has moved or never existed. Try the catalog, or search
          by product name, code or lot number.
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <ButtonLink href="/shop" variant="contained" endIcon={<NorthEastIcon />}>
            Browse the catalog
          </ButtonLink>
          <ButtonLink href="/" variant="outlined">
            Home
          </ButtonLink>
        </Stack>
      </Stack>
    </Section>
  )
}
