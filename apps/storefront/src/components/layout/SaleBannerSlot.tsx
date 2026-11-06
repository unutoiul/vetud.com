import { getLiveSale } from "@/lib/medusa/sale"
import SaleBanner from "./SaleBanner"
import { getFormatter } from "next-intl/server"

/** Shows the sale bar only while a sale from Admin > Sales is live. */
export default async function SaleBannerSlot() {
  const [sale, format] = await Promise.all([getLiveSale(), getFormatter()])
  const endLabel = sale?.ends_at ? format.dateTime(new Date(sale.ends_at), { day: "numeric", month: "short" }) : null
  return sale ? <SaleBanner sale={sale} endLabel={endLabel} /> : null
}
