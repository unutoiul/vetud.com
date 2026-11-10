import { getContentTranslator } from "@/i18n/server-content"
import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { cacheLife } from "next/cache"
import { getTranslations } from "next-intl/server"
import { SITE } from "@/lib/config"
import { gutter } from "@/theme/tokens"
import Icon from "../brand/Icon"
import Logo from "../brand/Logo"
import { AppLink, ButtonLink } from "../common/links"
import { FOOTER_LEGAL_LINKS, NAV_LABEL_KEYS, NAV_LINKS } from "./nav"

async function CopyrightYear() {
  "use cache"
  cacheLife("days")
  return <>{new Date().getFullYear()}</>
}

const linkSx = { color: "brand.onNavyMuted", fontWeight: 400, fontSize: 13.5, width: "fit-content", transition: "color .2s", "&:hover": { color: "#fff" } }

async function LinkColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="eyebrow" component="h2" sx={{ color: "brand.onNavy", mb: 2.5, fontWeight: 650, letterSpacing: ".03em" }}>
        {title}
      </Typography>
      <Stack spacing={1.75}>{children}</Stack>
    </Box>
  )
}

export default async function Footer() {
  const ct = await getContentTranslator()
  const t = await getTranslations("Footer")
  const common = await getTranslations("Common")
  return (
    <Box component="footer" sx={{ bgcolor: "brand.navyDeep", color: "brand.onNavy", borderTop: "1px solid", borderColor: "#ffffff22", px: gutter, pt: { xs: 6, md: 8 }, pb: 4 }}>
      <Box sx={{ maxWidth: 1360, mx: "auto" }}>
        <Stack direction={{ xs: "column", md: "row" }} sx={{ justifyContent: "space-between", alignItems: { md: "center" }, gap: 3, pb: { xs: 5, md: 7 }, mb: { xs: 5, md: 7 }, borderBottom: "1px solid #ffffff22" }}>
          <Box><Typography variant="mono" component="p" sx={{ fontSize: 10, letterSpacing: ".16em", color: "brand.onNavyMuted", mb: 2 }}>{t("tagline")}</Typography><Typography component="h2" sx={{ fontSize: { xs: 30, md: 42 }, fontWeight: 400, letterSpacing: "-.045em", lineHeight: 1.2 }}>{t("title")}</Typography></Box>
          <ButtonLink href="/contact" variant="outlined" endIcon={<Icon name="arrowUpRight" />} sx={{ alignSelf: { xs: "flex-start", md: "center" }, borderColor: "#ffffff55", color: "#fff", "&:hover": { bgcolor: "#ffffff11", borderColor: "#fff" } }}>{t("talk")}</ButtonLink>
        </Stack>
        <Grid container spacing={{ xs: 5, md: 5 }} sx={{ pb: { xs: 6, md: 7 } }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Logo tone="light" />
            <Typography sx={{ mt: 2.5, maxWidth: 380, color: "brand.onNavyMuted", fontSize: 13.5, lineHeight: 1.9 }}>
              {ct(SITE.description)}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <LinkColumn title={t("explore")}>
              {NAV_LINKS.map((link) => <AppLink key={link.href} href={link.href} underline="hover" sx={linkSx}>{common(NAV_LABEL_KEYS[link.href])}</AppLink>)}
              <AppLink href="/contact" underline="hover" sx={linkSx}>{t("contact")}</AppLink>
            </LinkColumn>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <LinkColumn title={t("legal")}>
              {FOOTER_LEGAL_LINKS.map((link) => <AppLink key={link.href} href={link.href} underline="hover" sx={linkSx}>{ct(link.label)}</AppLink>)}
            </LinkColumn>
          </Grid>
        </Grid>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ borderTop: "1px solid", borderColor: "#ffffff22", pt: 3, justifyContent: "space-between", color: "brand.onNavyMuted", fontSize: 11.5 }}
        >
          <Typography sx={{ maxWidth: 760, fontSize: "inherit", lineHeight: 1.7 }}>{ct(SITE.siteNotice)}</Typography>
          <Typography sx={{ fontSize: "inherit", lineHeight: 1.7 }}>
            © <CopyrightYear /> {SITE.name}
            <br />
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          </Typography>
        </Stack>
      </Box>
    </Box>
  )
}
