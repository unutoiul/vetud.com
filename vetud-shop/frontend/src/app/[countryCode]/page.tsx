import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { countryCode } from "next/root-params"
import ShopHome from "@/components/home/ShopHome"
import { BASE_URL } from "@/lib/config"
import { storefrontLanguages, storefrontMetadata } from "@/lib/storefront-seo"
import { isStoreSegment, parseStoreSegment } from "@/lib/store-segment"

export async function generateMetadata({ params }: PageProps<"/[countryCode]">): Promise<Metadata> {
  // The canonical URL is the country's, whatever currency the page was rendered in.
  const countryCode = parseStoreSegment((await params).countryCode).country
  const metadata = await storefrontMetadata({
    title: "Research Peptides & Laboratory Materials | VETUD",
    description:
      "Browse VETUD research peptides and laboratory materials, with lot documentation, for laboratory research use only.",
    country: countryCode,
    path: "",
  })
  const url = countryCode === "us" ? BASE_URL : `${BASE_URL}/${countryCode}`
  return {
    ...metadata,
    alternates: { canonical: url, languages: { ...storefrontLanguages(""), "en-US": BASE_URL, "x-default": BASE_URL } },
    openGraph: { ...metadata.openGraph, url },
  }
}

export default async function HomePage() {
  // Files the proxy skips (/ads.txt, /logo.png) arrive here as if their name were a country: 404, not the home page.
  if (!isStoreSegment(await countryCode())) notFound()
  return <ShopHome />
}
