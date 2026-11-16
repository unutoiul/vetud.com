import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { checkoutFunnel, furthestCheckoutStep, type CartProgress } from "../../../lib/checkout-progress"

const RANGES = [1, 7, 30]
const CART_LIMIT = 1000

type CartRow = CartProgress & {
  id: string
  created_at: string | Date
  updated_at: string | Date
  currency_code?: string | null
  customer?: { first_name?: string | null; last_name?: string | null; has_account?: boolean | null } | null
  shipping_address?: { address_1?: string | null; first_name?: string | null; last_name?: string | null; city?: string | null; country_code?: string | null } | null
  shipping_methods?: { name?: string | null }[] | null
  payment_collection?: { payment_sessions?: { provider_id?: string | null }[] | null } | null
  items?: { title?: string | null; product_title?: string | null; variant_title?: string | null; quantity?: number | null; unit_price?: unknown }[] | null
}

/**
 * GET /admin/unfinished-checkouts?days=1|7|30: carts with items that were active in that time and
 * never became an order, newest first, with how far each shopper got, plus the funnel for all carts.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const days = RANGES.includes(Number(req.query.days)) ? Number(req.query.days) : 7
  const since = new Date(Date.now() - days * 86_400_000)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "cart",
    fields: [
      "id", "email", "created_at", "updated_at", "completed_at", "currency_code",
      "customer.first_name", "customer.last_name", "customer.has_account",
      "shipping_address.address_1", "shipping_address.first_name", "shipping_address.last_name", "shipping_address.city", "shipping_address.country_code",
      "shipping_methods.name", "payment_collection.payment_sessions.provider_id",
      "items.title", "items.product_title", "items.variant_title", "items.quantity", "items.unit_price",
    ],
    filters: { updated_at: { $gte: since } },
    pagination: { take: CART_LIMIT, skip: 0, order: { updated_at: "DESC" } },
  })
  const carts = (data as CartRow[]).filter((cart) => cart.items?.length)

  const checkouts = carts.filter((cart) => !cart.completed_at).map((cart) => {
    const address = cart.shipping_address
    const name = [address?.first_name || cart.customer?.first_name, address?.last_name || cart.customer?.last_name].filter(Boolean).join(" ")
    return {
      id: cart.id,
      email: cart.email ?? null,
      name: name || null,
      member: cart.customer?.has_account === true,
      step: furthestCheckoutStep(cart),
      started_at: cart.created_at,
      last_activity_at: cart.updated_at,
      place: [address?.city, address?.country_code?.toUpperCase()].filter(Boolean).join(", ") || null,
      delivery: cart.shipping_methods?.[0]?.name ?? null,
      payment: cart.payment_collection?.payment_sessions?.[0]?.provider_id ?? null,
      currency_code: cart.currency_code ?? null,
      value: (cart.items ?? []).reduce((sum, item) => sum + Number(item.unit_price ?? 0) * Number(item.quantity ?? 0), 0),
      items: (cart.items ?? []).map((item) => ({ title: [item.product_title ?? item.title, item.variant_title].filter(Boolean).join(" · "), quantity: Number(item.quantity ?? 0) })),
    }
  })

  res.setHeader("Cache-Control", "private, no-store")
  res.json({ days, since, truncated: data.length >= CART_LIMIT, funnel: checkoutFunnel(carts), checkouts })
}
