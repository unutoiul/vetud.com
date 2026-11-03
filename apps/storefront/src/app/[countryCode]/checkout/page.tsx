import type { Metadata } from "next"
import Box from "@mui/material/Box"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { getTranslations } from "next-intl/server"
import { LockIcon } from "@/components/brand/Icon"
import CheckoutFlow from "@/components/checkout/CheckoutFlow"
import Section from "@/components/common/Section"
import { gutter } from "@/theme/tokens"

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
}

export default async function CheckoutPage() {
  const t = await getTranslations("Checkout")
  return (
    <>
      {/* A slim header keeps the order form above the fold. */}
      <Box component="header" sx={{ bgcolor: "brand.paper", borderBottom: "1px solid", borderColor: "divider", px: gutter, py: { xs: 3, md: 4 } }}>
        <Stack direction="row" sx={{ maxWidth: 1360, mx: "auto", alignItems: "flex-end", justifyContent: "space-between", gap: 2 }}>
          <Box>
            <Typography variant="mono" component="p" sx={{ color: "brand.blue", fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase" }}>
              VETUD / {t("secureCheckout")}
            </Typography>
            <Typography variant="h1" sx={{ mt: 1.25, fontSize: { xs: 30, md: 38 }, fontWeight: 400, lineHeight: 1.15, letterSpacing: "-.04em" }}>
              {t("title")}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.75} sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", color: "text.secondary", pb: 0.5 }}>
            <LockIcon sx={{ fontSize: 16 }} />
            <Typography variant="body2">{t("secure")}</Typography>
          </Stack>
        </Stack>
      </Box>
      <Section tone="white" tight>
        <CheckoutFlow />
      </Section>
    </>
  )
}
