import { getLiveSale } from "@/lib/medusa/sale"
import SaleBanner from "./SaleBanner"

/** Shows the sale bar only while a sale from Admin > Sales is live. */
export default async function SaleBannerSlot() {
  const sale = await getLiveSale()
  return sale ? <SaleBanner sale={sale} /> : null
}
