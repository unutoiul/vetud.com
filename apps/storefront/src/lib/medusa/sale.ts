import { cacheLife, cacheTag } from "next/cache"
import { sdk } from "./sdk"

/** The sale running now (Admin > Sales). The same for every region: only the prices differ. */
export type LiveSale = { title: string; percent_off: number; ends_at: string | null }

/** Refreshed every few minutes, so a sale appears and disappears without a deploy. */
export async function getLiveSale(): Promise<LiveSale | null> {
  "use cache"
  cacheLife("minutes")
  cacheTag("sale")
  try {
    const { sale } = await sdk.client.fetch<{ sale: LiveSale | null }>("/store/storewide-sale")
    return sale
  } catch {
    // No bar rather than a broken page if the backend can't be reached.
    return null
  }
}
