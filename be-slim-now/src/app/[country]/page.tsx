import { notFound } from "next/navigation"
import Storefront, { storefrontMetadata } from "@/components/Storefront"
import { MARKET_CODES, isMarket } from "@/config/markets"

/**
 * The same page with one country's prices (/de, /fr, /gb…), built ahead of time for every country
 * in the picker. The proxy serves it at "/" to visitors from that country; it also works as a
 * direct link. Search engines index each country at its own address (src/lib/seo.ts).
 */
export const dynamicParams = false

export function generateStaticParams() {
  return MARKET_CODES.map((code) => ({ country: code.toLowerCase() }))
}

export async function generateMetadata({ params }: PageProps<"/[country]">) {
  const code = (await params).country.toUpperCase()
  return isMarket(code) ? storefrontMetadata(code) : {}
}

export default async function CountryHome({ params }: PageProps<"/[country]">) {
  const code = (await params).country.toUpperCase()
  if (!isMarket(code)) notFound()
  return <Storefront country={code} />
}
