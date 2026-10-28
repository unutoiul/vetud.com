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
import { FOOTER_LINKS } from "./nav"

async function CopyrightYear() {
  "use cache"
  cacheLife("days")
  return <>{new Date().getFullYear()}</>
}

async function LinkColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  const common = await getTranslations("Common")
  const t = await getTranslations("Footer")
  const labels: Record<string, string> = { "/shop": common("shop"), "/standards": common("standards"), "/documentation": common("documentation"), "/education": common("learn"), "/tracking": common("tracking"), "/account/orders": t("orders"), "/contact": t("contact"), "/legal/shipping": t("shipping"), "/legal/terms": t("terms"), "/legal/privacy": t("privacy"), "/legal/research-use": t("research"), "/legal/returns": t("returns"), "/legal/refunds": t("refunds"), "/legal/chargebacks": t("chargebacks") }
  return (
    <Box>
      <Typography variant="eyebrow" component="h2" sx={{ color: "brand.onNavy", mb: 2.5, fontWeight: 650, letterSpacing: ".03em" }}>
        {title}
      </Typography>
      <Stack spacing={1.75}>
        {links.map((link) => (
          <AppLink
            key={link.href}
            href={link.href}
            underline="hover"
            sx={{ color: "brand.onNavyMuted", fontWeight: 400, fontSize: 13.5, width: "fit-content", transition: "color .2s", "&:hover": { color: "#fff" } }}
          >
            {labels[link.href] ?? link.label}
          </AppLink>
        ))}
      </Stack>
    </Box>
  )
}

export default async function Footer() {
  const t = await getTranslations("Footer")
  return (
    <Box component="footer" sx={{ bgcolor: "brand.navyDeep", color: "brand.onNavy", borderTop: "1px solid", borderColor: "#ffffff22", px: gutter, pt: { xs: 6, md: 8 }, pb: 4 }}>
      <Box sx={{ maxWidth: 1360, mx: "auto" }}>
        <Stack direction={{ xs: "column", md: "row" }} sx={{ justifyContent: "space-between", alignItems: { md: "center" }, gap: 3, pb: { xs: 5, md: 7 }, mb: { xs: 5, md: 7 }, borderBottom: "1px solid #ffffff22" }}>
          <Box><Typography variant="mono" component="p" sx={{ fontSize: 10, letterSpacing: ".16em", color: "brand.onNavyMuted", mb: 2 }}>{t("tagline")}</Typography><Typography component="h2" sx={{ fontSize: { xs: 30, md: 42 }, fontWeight: 400, letterSpacing: "-.045em", lineHeight: 1.2 }}>{t("title")}</Typography></Box>
          <ButtonLink href="/contact" variant="outlined" endIcon={<Icon name="arrowUpRight" />} sx={{ alignSelf: { xs: "flex-start", md: "center" }, borderColor: "#ffffff55", color: "#fff", "&:hover": { bgcolor: "#ffffff11", borderColor: "#fff" } }}>{t("talk")}</ButtonLink>
        </Stack>
        <Grid container spacing={{ xs: 5, md: 5 }} sx={{ pb: { xs: 6, md: 7 } }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Logo tone="light" />
            <Typography sx={{ mt: 2.5, maxWidth: 330, color: "brand.onNavyMuted", fontSize: 13.5, lineHeight: 1.9 }}>
              {t("about")}
            </Typography>
            <Box sx={{ mt: 3, maxWidth: 330, border: "1px solid #ffffff22", borderRadius: "5px", p: 2.5 }}>
              <Typography sx={{ color: "brand.onNavyMuted", fontSize: 12.5, mb: 1.25 }}>{t("question")}</Typography>
              <ButtonLink href="/contact" size="small" endIcon={<Icon name="arrowUpRight" sx={{ fontSize: 17 }} />} sx={{ p: 0, color: "brand.onNavy", fontWeight: 600, minWidth: 0, "&:hover": { color: "brand.tealBright", bgcolor: "transparent" } }}>
                {t("contact")}
              </ButtonLink>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, md: 2.5 }}>
            <LinkColumn title={t("explore")} links={FOOTER_LINKS.explore} />
          </Grid>
          <Grid size={{ xs: 6, md: 2.75 }}>
            <LinkColumn title={t("information")} links={FOOTER_LINKS.information} />
          </Grid>
          <Grid size={{ xs: 12, md: 2.75 }}>
            <LinkColumn title={t("legal")} links={FOOTER_LINKS.legal} />
          </Grid>
        </Grid>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ borderTop: "1px solid", borderColor: "#ffffff22", pt: 3, justifyContent: "space-between", color: "brand.onNavyMuted", fontSize: 11.5 }}
        >
          <Typography sx={{ maxWidth: 760, fontSize: "inherit", lineHeight: 1.7 }}>
            {SITE.ruoNotice} Nothing on this site is medical advice. Product availability varies by
            region.
          </Typography>
          <Typography sx={{ fontSize: "inherit", lineHeight: 1.7 }}>
            © <CopyrightYear /> {SITE.legalName}
            <br />
            {SITE.address} · <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          </Typography>
        </Stack>
      </Box>
    </Box>
  )
}
