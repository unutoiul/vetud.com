import type { Metadata } from "next"
import { BASE_URL, SUPPORTED_COUNTRIES } from "@/lib/config"
import type { LearnIllustration } from "@/content/learn/illustrations"

// The article body is English in every storefront. Consolidate identical regional
// copies on one preferred URL, while retaining the visitor's regional navigation.
export const ARTICLE_COUNTRY = "us"
export const articleUrl = (path: string) => `${BASE_URL}/${ARTICLE_COUNTRY}${path}`

export function articleLanguages(path: string) {
  return Object.fromEntries([
    ...SUPPORTED_COUNTRIES.map(country => [`en-${country.toUpperCase()}`, `${BASE_URL}/${country}${path}`]),
    ["x-default", articleUrl(path)],
  ])
}

export function readingMinutes(parts: string[]) {
  return Math.max(1, Math.ceil(plainText(parts.join(" ")).split(/\s+/).filter(Boolean).length / 200))
}

export function plainText(text: string) {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
}

export function articleMetadata({ title, description, path, image }: {
  title: string; description: string; path: string; image?: LearnIllustration
}): Metadata {
  const url = articleUrl(path)
  const images = image ? [{ url: `${BASE_URL}${image.src}`, alt: image.alt }] : undefined
  return {
    title: { absolute: `${title} | VETUD Learn` }, description,
    alternates: { canonical: url, languages: articleLanguages(path) },
    authors: [{ name: "VETUD Learn", url: `${BASE_URL}/us/learn` }],
    openGraph: { type: "article", siteName: "VETUD Peptides Education", locale: "en_US", title, description, url, images },
    twitter: { card: "summary_large_image", title, description, images: images?.map(image => image.url) },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  }
}

/** Shared English library pages consolidate on the same preferred region as articles. */
export function collectionMetadata(input: { title: string; description: string; path: string }): Metadata {
  const metadata = articleMetadata(input)
  return { ...metadata, openGraph: { ...metadata.openGraph, type: "website" },
    twitter: { card: "summary", title: input.title, description: input.description } }
}

export function articleStructuredData({ title, description, path, image, breadcrumbs, sources, text }: {
  title: string; description: string; path: string; image?: LearnIllustration
  breadcrumbs: { name: string; path: string }[]; sources: { url: string }[]; text: string[]
}) {
  const url = articleUrl(path)
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article", "@id": `${url}#article`, url,
        headline: title, description, inLanguage: "en", isAccessibleForFree: true,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        ...(image ? { image: [`${BASE_URL}${image.src}`] } : {}),
        author: { "@type": "Organization", name: "VETUD Learn", url: `${BASE_URL}/us/learn` },
        publisher: { "@type": "Organization", name: "VETUD", url: BASE_URL, logo: { "@type": "ImageObject", url: `${BASE_URL}/brand/vetud-logo.svg` } },
        citation: sources.map(source => source.url),
        wordCount: plainText(text.join(" ")).split(/\s+/).filter(Boolean).length,
      },
      {
        "@type": "BreadcrumbList", "@id": `${url}#breadcrumbs`,
        itemListElement: breadcrumbs.map((item, index) => ({
          "@type": "ListItem", position: index + 1, name: item.name, item: articleUrl(item.path),
        })),
      },
    ],
  }
}
