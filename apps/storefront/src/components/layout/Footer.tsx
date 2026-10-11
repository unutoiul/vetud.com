import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { cacheLife } from "next/cache"
import { SITE } from "@/lib/config"
import { gutter } from "@/theme/tokens"
import Logo from "../brand/Logo"
import { AppLink, ButtonLink } from "../common/links"
import { FOOTER_LINKS } from "./nav"

async function CopyrightYear() {
  "use cache"
  cacheLife("days")
  return <>{new Date().getFullYear()}</>
}

function LinkColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <Box>
      <Typography variant="eyebrow" component="h2" sx={{ color: "brand.tealBright", mb: 2 }}>
        {title}
      </Typography>
      <Stack spacing={1.25}>
        {links.map((link) => (
          <AppLink
            key={link.href}
            href={link.href}
            underline="hover"
            sx={{ color: "#c4d9d9", fontWeight: 500, fontSize: 14 }}
          >
            {link.label}
          </AppLink>
        ))}
      </Stack>
    </Box>
  )
}

export default function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: "brand.navy", color: "#c4d9d9", px: gutter, pt: { xs: 7, md: 9 }, pb: 4 }}>
      <Box sx={{ maxWidth: 1240, mx: "auto" }}>
        <Grid container spacing={{ xs: 5, md: 4 }} sx={{ pb: { xs: 6, md: 8 } }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Logo tone="light" />
            <Typography sx={{ mt: 2.5, maxWidth: 320, color: "#9fbcc1", fontSize: 14 }}>
              Research-grade materials with lot-level documentation, clear specifications and
              people behind the science.
            </Typography>
            <ButtonLink
              href="/contact"
              variant="outlined"
              size="small"
              sx={{ mt: 3, color: "#d4ecea", borderColor: "#376271", borderRadius: 999 }}
            >
              Contact the team
            </ButtonLink>
          </Grid>
          <Grid size={{ xs: 6, md: 2.5 }}>
            <LinkColumn title="Explore" links={FOOTER_LINKS.explore} />
          </Grid>
          <Grid size={{ xs: 6, md: 2.75 }}>
            <LinkColumn title="Information" links={FOOTER_LINKS.information} />
          </Grid>
          <Grid size={{ xs: 12, md: 2.75 }}>
            <LinkColumn title="Legal" links={FOOTER_LINKS.legal} />
          </Grid>
        </Grid>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ borderTop: "1px solid #214656", pt: 3, justifyContent: "space-between", color: "#8aa6ad", fontSize: 12.5 }}
        >
          <Typography sx={{ maxWidth: 760, fontSize: "inherit", lineHeight: 1.7 }}>
            {SITE.ruoNotice} Nothing on this site is medical advice. Product availability varies by
            region.
          </Typography>
          <Typography sx={{ fontSize: "inherit", whiteSpace: "nowrap" }}>
            © <CopyrightYear /> {SITE.name}
          </Typography>
        </Stack>
      </Box>
    </Box>
  )
}
