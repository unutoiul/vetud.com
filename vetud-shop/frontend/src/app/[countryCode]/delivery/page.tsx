import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import Skeleton from "@mui/material/Skeleton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import Icon, { type IconName } from "@/components/brand/Icon"
import { AppLink, ButtonLink } from "@/components/common/links"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import {
  getLocalDelivery,
  LOCAL_DELIVERY_COUNTRIES,
  type DeliveryValues,
  type PaymentKind,
} from "@/content/local-delivery"
import { SITE } from "@/lib/config"
import { listOfferedPaymentProviders } from "@/lib/medusa/payment-methods"
import { getStoreRegion } from "@/lib/medusa/regions"
import { parseStoreSegment } from "@/lib/store-segment"
import { storefrontUrl } from "@/lib/storefront-seo"
import { brand } from "@/theme/tokens"

/**
 * /<country>/delivery: delivery, payment and customs for one country, in its own language, for
 * shoppers searching from that market (owner, 2026-11-25). Only the countries in
 * content/local-delivery.ts have one; the free-delivery amount, currency and payment methods come
 * live from the shop.
 */

const PATH = "/delivery"
const PAYMENT_ICONS: Record<PaymentKind, IconName> = { card: "card", bank: "bank", crypto: "coin" }

/** The delivery pages only exist in their own countries, so they point at each other and nowhere else. */
function deliveryLanguages() {
  return Object.fromEntries([
    ...LOCAL_DELIVERY_COUNTRIES.map((country) => [getLocalDelivery(country)!.locale, storefrontUrl(country, PATH)]),
    ["x-default", storefrontUrl("gb", PATH)],
  ])
}

async function loadPage(segment: string) {
  const { country, currency } = parseStoreSegment(segment)
  const page = getLocalDelivery(country)
  if (!page) return null
  const region = await getStoreRegion(country, currency)
  if (!region) return null
  const currencyCode = region.currency_code.toLowerCase()
  const threshold =
    typeof region.metadata?.free_shipping_threshold === "number" ? region.metadata.free_shipping_threshold : null
  const free =
    threshold && threshold > 0
      ? new Intl.NumberFormat(page.locale, {
          style: "currency",
          currency: currencyCode.toUpperCase(),
          maximumFractionDigits: 0,
        }).format(threshold)
      : null
  const providers = await listOfferedPaymentProviders(region.id, currencyCode).catch(() => [])
  // One entry per kind of payment: a second card processor is still "card" to the shopper.
  const methods = providers
    .flatMap((id) => (page.methods[id] ? [{ id, ...page.methods[id] }] : []))
    .filter((method, index, all) => all.findIndex((other) => other.kind === method.kind) === index)
  const values: DeliveryValues = {
    free,
    methods: new Intl.ListFormat(page.locale, { type: "disjunction" }).format(methods.map((method) => method.short)),
    currency: page.currencies[currencyCode] ?? currencyCode.toUpperCase(),
    email: SITE.email,
  }
  return { country, page, methods, values }
}

export async function generateMetadata({ params }: PageProps<"/[countryCode]/delivery">): Promise<Metadata> {
  const loaded = await loadPage((await params).countryCode)
  if (!loaded) return {}
  const { country, page, values } = loaded
  const url = storefrontUrl(country, PATH)
  const description = page.metaDescription(values)
  return {
    title: { absolute: page.metaTitle },
    description,
    alternates: { canonical: url, languages: deliveryLanguages() },
    openGraph: {
      type: "website",
      siteName: "VETUD",
      title: page.metaTitle,
      description,
      url,
      locale: page.locale.replace("-", "_"),
    },
  }
}

export default function DeliveryPage({ params }: PageProps<"/[countryCode]/delivery">) {
  return (
    <Suspense fallback={<Skeleton variant="rectangular" height={720} />}>
      <DeliveryContent params={params} />
    </Suspense>
  )
}

async function DeliveryContent({ params }: Pick<PageProps<"/[countryCode]/delivery">, "params">) {
  const loaded = await loadPage((await params).countryCode)
  if (!loaded) notFound()
  const { country, page, methods, values } = loaded
  const faq = page.faq(values)
  const paymentNames = methods.map((method) => method.short)
  const paymentSummary = paymentNames.length
    ? capitalize(new Intl.ListFormat(page.locale, { type: "disjunction" }).format(paymentNames), page.locale)
    : page.facts.payment.atCheckout

  const facts: { icon: IconName; label: string; value: string; note: string }[] = [
    { icon: "clock", ...page.facts.time },
    {
      icon: "truck",
      label: page.facts.cost.label,
      value: values.free ? page.facts.cost.value(values) : page.facts.cost.atCheckout,
      note: page.facts.cost.note,
    },
    { icon: "wallet", label: page.facts.payment.label, value: paymentSummary, note: page.facts.payment.note(values) },
    { icon: "globe", ...page.facts.customs },
  ]

  const url = storefrontUrl(country, PATH)
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        url,
        inLanguage: page.locale,
        mainEntity: faq.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumbs`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: page.breadcrumbHome, item: storefrontUrl(country) },
          { "@type": "ListItem", position: 2, name: page.title, item: url },
        ],
      },
    ],
  }

  return (
    <Box lang={page.locale}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <PageHeader eyebrow={page.eyebrow} title={page.title} description={page.intro} />

      <Section tone="white">
        <Grid container spacing={2.5} component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
          {facts.map((fact) => (
            <Grid key={fact.label} size={{ xs: 12, sm: 6, lg: 3 }} component="li">
              <Paper variant="outlined" sx={{ height: "100%", p: 3, bgcolor: brand.slate25, borderRadius: 3 }}>
                <Icon name={fact.icon} sx={{ color: "secondary.main", mb: 1.5 }} />
                <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  {fact.label}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.5,
                    fontSize: { xs: 20, md: 22 },
                    fontWeight: 600,
                    lineHeight: 1.3,
                    letterSpacing: "-.02em",
                  }}
                >
                  {fact.value}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1.25, color: "text.secondary", lineHeight: 1.7 }}>
                  {fact.note}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Section>

      <Section tone="paper">
        <Grid container spacing={{ xs: 6, md: 8 }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Typography variant="h4" component="h2" sx={{ mb: 3 }}>
              {page.howToPay}
            </Typography>
            <Stack spacing={2}>
              {methods.length ? (
                methods.map((method) => (
                  <Paper key={method.id} variant="outlined" sx={{ p: 2.5, display: "flex", gap: 2, borderRadius: 3 }}>
                    <Icon
                      name={PAYMENT_ICONS[method.kind]}
                      sx={{ color: "secondary.main", mt: "2px", flexShrink: 0 }}
                    />
                    <Box>
                      <Typography component="h3" sx={{ fontWeight: 700 }}>
                        {method.name}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary", lineHeight: 1.7 }}>
                        {method.text}
                      </Typography>
                    </Box>
                  </Paper>
                ))
              ) : (
                <Typography sx={{ color: "text.secondary" }}>{page.facts.payment.atCheckout}</Typography>
              )}
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <Typography variant="h4" component="h2" sx={{ mb: 3 }}>
              {page.faqTitle}
            </Typography>
            <Stack
              component="dl"
              divider={<Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />}
              spacing={2.5}
              sx={{ m: 0 }}
            >
              {faq.map(({ q, a }) => (
                <Box key={q}>
                  <Typography component="dt" sx={{ fontWeight: 700, fontSize: 17 }}>
                    {q}
                  </Typography>
                  <Typography component="dd" sx={{ m: 0, mt: 1, color: "text.secondary", lineHeight: 1.8 }}>
                    {a}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Section>

      <Section tone="white" tight>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}
        >
          <Box>
            <Typography variant="h4" component="h2">
              {page.ctaTitle}
            </Typography>
            <Stack direction="row" spacing={3} sx={{ mt: 1.5, flexWrap: "wrap", rowGap: 1 }}>
              <AppLink href="/legal/shipping">{page.links.shipping}</AppLink>
              <AppLink href="/legal/returns">{page.links.returns}</AppLink>
              <AppLink href="/contact">{page.links.contact}</AppLink>
            </Stack>
          </Box>
          <ButtonLink
            href="/shop"
            variant="contained"
            size="large"
            endIcon={<Icon name="arrowRight" />}
            sx={{ alignSelf: { xs: "flex-start", md: "center" } }}
          >
            {page.ctaButton}
          </ButtonLink>
        </Stack>
      </Section>
    </Box>
  )
}

const capitalize = (text: string, locale: string) => text.charAt(0).toLocaleUpperCase(locale) + text.slice(1)
