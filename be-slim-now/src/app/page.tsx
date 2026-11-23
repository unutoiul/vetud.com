import Storefront, { storefrontMetadata } from "@/components/Storefront"
import { DEFAULT_COUNTRY } from "@/config/markets"

/**
 * The page with US prices. Visitors whose country is in the picker (saved choice first, then where
 * the visit comes from) are served /<country> at this same address instead; see src/proxy.ts.
 */
export const generateMetadata = () => storefrontMetadata(DEFAULT_COUNTRY)

export default function Home() {
  return <Storefront country={DEFAULT_COUNTRY} />
}
