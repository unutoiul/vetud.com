import type { Metadata } from "next"
import { BASE_URL, SUPPORTED_COUNTRIES } from "@/lib/config"
import type { LearnIllustration } from "@/content/learn/illustrations"
import { getCountryRules } from "@/i18n/config"
import { getPageLocalization } from "@/i18n/metadata"

export const ARTICLE_COUNTRY = "us"
export const articleUrl = (path: string, country = ARTICLE_COUNTRY) => `${BASE_URL}/${country}${path}`

export function articleLanguages(path: string) {
  return Object.fromEntries([
    ...SUPPORTED_COUNTRIES.map(country => [getCountryRules(country).locale, `${BASE_URL}/${country}${path}`]),
    ["x-default", articleUrl(path)],
  ])
}

export function readingMinutes(parts: string[]) {
  return Math.max(1, Math.ceil(plainText(parts.join(" ")).split(/\s+/).filter(Boolean).length / 200))
}

export function plainText(text: string) {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
}

export async function articleMetadata({ title, description, path, image }: {
  title: string; description: string; path: string; image?: LearnIllustration
}): Promise<Metadata> {
  const { country, ct, openGraphLocale } = await getPageLocalization()
  title = ct(title)
  description = ct(description)
  const url = articleUrl(path, country)
  const images = image ? [{ url: `${BASE_URL}${image.src}`, alt: ct(image.alt) }] : undefined
  return {
    title: { absolute: `${title} | VETUD Learn` }, description,
    alternates: { canonical: url, languages: articleLanguages(path) },
    authors: [{ name: "VETUD Learn", url: articleUrl("/learn", country) }],
    openGraph: { type: "article", siteName: "VETUD Peptides Education", locale: openGraphLocale, title, description, url, images },
    twitter: { card: "summary_large_image", title, description, images: images?.map(image => image.url) },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  }
}

export async function collectionMetadata(input: { title: string; description: string; path: string }): Promise<Metadata> {
  const metadata = await articleMetadata(input)
  return { ...metadata, openGraph: { ...metadata.openGraph, type: "website" },
    twitter: { card: "summary", title: metadata.title ?? undefined, description: metadata.description ?? undefined } }
}

export async function articleStructuredData({ title, description, path, image, breadcrumbs, sources, text }: {
  title: string; description: string; path: string; image?: LearnIllustration
  breadcrumbs: { name: string; path: string }[]; sources: { url: string }[]; text: string[]
}) {
  const { country, ct, locale } = await getPageLocalization()
  const url = articleUrl(path, country)
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article", "@id": `${url}#article`, url,
        headline: ct(title), description: ct(description), inLanguage: locale, isAccessibleForFree: true,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        ...(image ? { image: [`${BASE_URL}${image.src}`] } : {}),
        author: { "@type": "Organization", name: "VETUD Learn", url: articleUrl("/learn", country) },
        publisher: { "@type": "Organization", name: "VETUD", url: BASE_URL, logo: { "@type": "ImageObject", url: `${BASE_URL}/brand/vetud-logo.svg` } },
        citation: sources.map(source => source.url),
        wordCount: plainText(text.map(part => ct(part)).join(" ")).split(/\s+/).filter(Boolean).length,
      },
      {
        "@type": "BreadcrumbList", "@id": `${url}#breadcrumbs`,
        itemListElement: breadcrumbs.map((item, index) => ({
          "@type": "ListItem", position: index + 1, name: ct(item.name), item: articleUrl(item.path, country),
        })),
      },
    ],
  }
}
