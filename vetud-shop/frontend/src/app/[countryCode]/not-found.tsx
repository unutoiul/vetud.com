import { useContentTranslator } from "@/i18n/use-content-translator"
import { useTranslations } from "next-intl"
import { ArrowUpRightIcon as NorthEastIcon } from "@/components/brand/Icon"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { ButtonLink } from "@/components/common/links"
import Section from "@/components/common/Section"

export default function NotFound() {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  return (
    <Section>
      <Stack spacing={3} sx={{ alignItems: "flex-start", maxWidth: 640, py: { md: 6 } }}>
        <Typography variant="eyebrow" sx={{ color: "secondary.main" }}>
          {ct("Error 404")}
        </Typography>
        <Typography variant="h2" component="h1">
          {ct("This sequence is not on file.")}
        </Typography>
        <Typography sx={{ color: "text.secondary" }}>
          {ct("The page you were looking for has moved or never existed. Try the catalog, or search by product name, code or lot number.")}
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <ButtonLink href="/shop" variant="contained" endIcon={<NorthEastIcon />}>
            {act("shopCatalog")}
          </ButtonLink>
          <ButtonLink href="/" variant="outlined">
            {act("home")}
          </ButtonLink>
        </Stack>
      </Stack>
    </Section>
  )
}
