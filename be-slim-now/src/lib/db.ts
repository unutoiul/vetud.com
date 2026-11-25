import "server-only"

/**
 * Orders and pop-up signups are saved by the VETUD shop's backend, in its tables `beslimnow_orders`
 * and `beslimnow_subscribers` (vetud-shop/backend/src/modules/beslimnow), every row marked
 * `source = 'beslimnow'`. This server posts to SHOP_API_URL/beslimnow/* with BESLIMNOW_API_SECRET,
 * the same value as on the shop's medusa-server. Without both (local development) the row is printed
 * to the console instead, like the emails.
 */

type Json = Record<string, unknown>

function connection() {
  const url = process.env.SHOP_API_URL?.trim().replace(/\/$/, "")
  const secret = process.env.BESLIMNOW_API_SECRET?.trim()
  return url && secret ? { url, secret } : null
}

async function post(path: "orders" | "subscribers", body: Json) {
  const shop = connection()
  if (!shop) {
    console.info(`[db:dev] beslimnow_${path}\n${JSON.stringify(body, null, 2)}`)
    return
  }
  const res = await fetch(`${shop.url}/beslimnow/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-beslimnow-secret": shop.secret },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Shop /beslimnow/${path} ${res.status}: ${(await res.text()).slice(0, 300)}`)
}

/** One row per address; asking again only updates last_seen_at and times_subscribed. */
export function saveSubscriberRow(email: string, country: string | null) {
  return post("subscribers", { email, country: country || null, signup_form: "promo-popup" })
}

export type OrderRow = {
  order_number: string
  placed_at: string
  product: string
  strength: string
  quantity: number
  currency: string
  unit_regular: number
  unit_price: number
  regular_total: number
  subtotal: number
  code_discount: number
  total: number
  promo_code: string | null
  name: string
  email: string
  phone: string
  contact_app: string
  contact_handle: string | null
  country: string
  address: string
  city: string
  postal_code: string
  note: string | null
  research_use_confirmed: boolean
  confirmation_sent: boolean
}

export function saveOrderRow(row: OrderRow) {
  return post("orders", row)
}
