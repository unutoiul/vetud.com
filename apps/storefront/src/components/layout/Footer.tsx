import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { cacheLife } from "next/cache"
import { SITE } from "@/lib/config"
import { gutter } from "@/theme/tokens"
import Icon, { type IconName } from "../brand/Icon"
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
      <Typography variant="eyebrow" component="h2" sx={{ color: "brand.navy", mb: 2.5, fontWeight: 650, letterSpacing: ".03em" }}>
        {title}
      </Typography>
      <Stack spacing={1.75}>
        {links.map((link) => (
          <AppLink
            key={link.href}
            href={link.href}
            underline="hover"
            sx={{ color: "text.secondary", fontWeight: 500, fontSize: 13.5, width: "fit-content", transition: "color .2s", "&:hover": { color: "brand.blue" } }}
          >
            {link.label}
          </AppLink>
        ))}
      </Stack>
    </Box>
  )
}

const assurances: { icon: IconName; title: string }[] = [
  { icon: "molecule", title: "Research-grade materials" },
  { icon: "document", title: "Lot-level documentation" },
  { icon: "support", title: "People behind the science" },
]

export default function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: "background.paper", color: "text.primary", borderTop: "1px solid", borderColor: "divider", px: gutter, pt: { xs: 6, md: 8 }, pb: 4 }}>
      <Box sx={{ maxWidth: 1360, mx: "auto" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 2.5, sm: 4 }} sx={{ justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider", pb: { xs: 4, md: 5 }, mb: { xs: 5, md: 7 } }}>
          {assurances.map((item) => (
            <Stack key={item.title} direction="row" spacing={1.75} sx={{ alignItems: "center" }}>
              <Icon name={item.icon} sx={{ color: "brand.teal", fontSize: 26 }} />
              <Typography sx={{ fontSize: { xs: 13, md: 14 }, fontWeight: 550, color: "brand.navySoft" }}>{item.title}</Typography>
            </Stack>
          ))}
        </Stack>
        <Grid container spacing={{ xs: 5, md: 5 }} sx={{ pb: { xs: 6, md: 7 } }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Logo tone="dark" />
            <Typography sx={{ mt: 2.5, maxWidth: 330, color: "text.secondary", fontSize: 13.5, lineHeight: 1.9 }}>
              Research-grade materials with lot-level documentation, clear specifications and
              people behind the science.
            </Typography>
            <Box sx={{ mt: 3, maxWidth: 330, bgcolor: "brand.navy", borderRadius: 3, p: 2.5 }}>
              <Typography sx={{ color: "brand.onNavyMuted", fontSize: 12.5, mb: 1.25 }}>A question about your research order?</Typography>
              <ButtonLink href="/contact" size="small" endIcon={<Icon name="arrowUpRight" sx={{ fontSize: 17 }} />} sx={{ p: 0, color: "brand.onNavy", fontWeight: 600, minWidth: 0, "&:hover": { color: "brand.tealBright", bgcolor: "transparent" } }}>
                Contact the team
              </ButtonLink>
            </Box>
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
          sx={{ borderTop: "1px solid", borderColor: "divider", pt: 3, justifyContent: "space-between", color: "text.secondary", fontSize: 11.5 }}
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
