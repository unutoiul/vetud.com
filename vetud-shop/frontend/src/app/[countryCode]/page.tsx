import type { Metadata } from "next"
import ShopHome from "@/components/home/ShopHome"
import { BASE_URL } from "@/lib/config"
import { storefrontLanguages, storefrontMetadata } from "@/lib/storefront-seo"
import { parseStoreSegment } from "@/lib/store-segment"

export async function generateMetadata({ params }: PageProps<"/[countryCode]">): Promise<Metadata> {
  // The canonical URL is the country's, whatever currency the page was rendered in.
  const countryCode = parseStoreSegment((await params).countryCode).country
  const metadata = await storefrontMetadata({
    title: "Research Peptides & Laboratory Materials | VETUD",
    description: "Browse VETUD research peptides and laboratory materials, with lot documentation, for laboratory research use only.",
    country: countryCode, path: "",
  })
  const url = countryCode === "us" ? BASE_URL : `${BASE_URL}/${countryCode}`
  return { ...metadata,
    alternates: { canonical: url, languages: { ...storefrontLanguages(""), "en-US": BASE_URL, "x-default": BASE_URL } },
    openGraph: { ...metadata.openGraph, url },
  }
}

export default function HomePage() {
  return <ShopHome />
}
