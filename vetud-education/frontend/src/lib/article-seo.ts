import type { Metadata } from "next"
import { BASE_URL } from "@/lib/config"
import type { LearnIllustration } from "@/content/learn/illustrations"
import { DEFAULT_LANGUAGE, LANGUAGES } from "@/i18n/languages"
import { getPageLocalization } from "@/i18n/metadata"

export const articleUrl = (path: string, language: string = DEFAULT_LANGUAGE) => `${BASE_URL}/${language}${path}`

export function articleLanguages(path: string) {
  return Object.fromEntries([
    ...LANGUAGES.map((language) => [language, articleUrl(path, language)]),
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
  const { language, ct, openGraphLocale } = await getPageLocalization()
  title = ct(title)
  description = ct(description)
  const url = articleUrl(path, language)
  const images = image ? [{ url: `${BASE_URL}${image.src}`, alt: ct(image.alt) }] : undefined
  return {
    title: { absolute: `${title} | VETUD Learn` }, description,
    alternates: { canonical: url, languages: articleLanguages(path) },
    authors: [{ name: "VETUD Learn", url: articleUrl("/learn", language) }],
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
  const { language, ct, locale } = await getPageLocalization()
  const url = articleUrl(path, language)
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article", "@id": `${url}#article`, url,
        headline: ct(title), description: ct(description), inLanguage: locale, isAccessibleForFree: true,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        ...(image ? { image: [`${BASE_URL}${image.src}`] } : {}),
        author: { "@type": "Organization", name: "VETUD Learn", url: articleUrl("/learn", language) },
        publisher: { "@type": "Organization", name: "VETUD", url: BASE_URL, logo: { "@type": "ImageObject", url: `${BASE_URL}/brand/vetud-logo.svg` } },
        citation: sources.map(source => source.url),
        wordCount: plainText(text.map(part => ct(part)).join(" ")).split(/\s+/).filter(Boolean).length,
      },
      {
        "@type": "BreadcrumbList", "@id": `${url}#breadcrumbs`,
        itemListElement: breadcrumbs.map((item, index) => ({
          "@type": "ListItem", position: index + 1, name: ct(item.name), item: articleUrl(item.path, language),
        })),
      },
    ],
  }
}
