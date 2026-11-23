import "server-only"

/**
 * The BeSlimNow Supabase project (tables `subscribers` and `orders`, see supabase/schema.sql). Only
 * the server writes, with the secret key; row level security has no policies, so the public key can
 * do nothing. Without SUPABASE_URL / SUPABASE_SECRET_KEY (local development) the row is printed to
 * the console instead, like the emails.
 */

type Json = Record<string, unknown>

function connection() {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/$/, "")
  const key = process.env.SUPABASE_SECRET_KEY?.trim()
  return url && key ? { url, key } : null
}

async function post(path: string, body: Json) {
  const db = connection()
  if (!db) {
    console.info(`[db:dev] ${path}\n${JSON.stringify(body, null, 2)}`)
    return
  }
  // New secret keys (sb_secret_…) go in the apikey header only; a legacy service_role key is a JWT
  // and also goes in Authorization.
  const auth: Record<string, string> = db.key.startsWith("sb_") ? {} : { authorization: `Bearer ${db.key}` }
  const res = await fetch(`${db.url}/rest/v1/${path}`, {
    method: "POST",
    headers: { apikey: db.key, ...auth, "content-type": "application/json", prefer: "return=minimal" },
    body: JSON.stringify(body),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Supabase ${path} ${res.status}: ${(await res.text()).slice(0, 300)}`)
}

/** One row per address; asking again only updates last_seen_at and times_subscribed. */
export function saveSubscriberRow(email: string, country: string | null) {
  return post("rpc/upsert_subscriber", { p_email: email, p_country: country ?? "", p_source: "promo-popup" })
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
