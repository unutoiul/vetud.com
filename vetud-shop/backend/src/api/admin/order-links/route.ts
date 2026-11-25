import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { furthestCheckoutStep, type CartProgress } from "../../../lib/checkout-progress"
import { emailSettings } from "../../../lib/notifications"
import { createOrderLinkWorkflow } from "../../../workflows/order-link"
import type { AdminCreateOrderLinkBody } from "./validators"

const LINK_LIMIT = 200

type LinkCart = CartProgress & {
  id: string
  created_at: string | Date
  updated_at: string | Date
  currency_code?: string | null
  total?: unknown
  metadata?: Record<string, unknown> | null
  shipping_address?: { address_1?: string | null; first_name?: string | null; last_name?: string | null; city?: string | null; country_code?: string | null } | null
  items?: { product_title?: string | null; title?: string | null; variant_title?: string | null; quantity?: number | null }[] | null
  order?: { id?: string | null; display_id?: number | null } | null
}

const LINK_FIELDS = [
  "id", "email", "created_at", "updated_at", "completed_at", "currency_code", "total", "metadata",
  "shipping_address.address_1", "shipping_address.first_name", "shipping_address.last_name", "shipping_address.city", "shipping_address.country_code",
  "shipping_methods.id", "payment_collection.payment_sessions.id",
  "items.product_title", "items.title", "items.variant_title", "items.quantity",
  "order.id", "order.display_id",
]

const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null)

/** The page the customer opens: the shop for their country, which loads this cart into checkout. */
export function orderLinkUrl(cart: { id: string; metadata?: Record<string, unknown> | null }) {
  const country = text(cart.metadata?.order_link_country) ?? "us"
  return `${emailSettings().storefrontUrl}/${country}/order-link?cart=${encodeURIComponent(cart.id)}`
}

function toLink(cart: LinkCart) {
  const meta = cart.metadata ?? {}
  const address = cart.shipping_address
  return {
    cart_id: cart.id,
    url: orderLinkUrl(cart),
    created_at: text(meta.order_link_created_at) ?? cart.created_at,
    last_activity_at: cart.updated_at,
    country_code: text(meta.order_link_country),
    customer_name: text(meta.order_link_customer),
    whatsapp: text(meta.order_link_whatsapp),
    email: text(meta.order_link_email) ?? cart.email ?? null,
    note: text(meta.order_link_note),
    payment_provider: text(meta.order_link_payment),
    step: furthestCheckoutStep(cart),
    ship_to: address?.address_1
      ? [[address.first_name, address.last_name].filter(Boolean).join(" "), address.city, address.country_code?.toUpperCase()].filter(Boolean).join(", ")
      : null,
    currency_code: cart.currency_code ?? null,
    total: Number(cart.total ?? 0),
    items: (cart.items ?? []).map((item) => ({
      title: [item.product_title ?? item.title, item.variant_title].filter(Boolean).join(" · "),
      quantity: Number(item.quantity ?? 0),
    })),
    order: cart.order?.id ? { id: cart.order.id, display_id: cart.order.display_id ?? null } : null,
  }
}

/**
 * GET /admin/order-links: the links made so far (newest first) with how far each customer got, and
 * the products and countries the form offers.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const [carts, products, regions] = await Promise.all([
    query.graph({
      entity: "cart",
      fields: LINK_FIELDS,
      filters: { metadata: { order_link: true } } as Record<string, unknown>,
      pagination: { take: LINK_LIMIT, skip: 0, order: { created_at: "DESC" } },
    }),
    query.graph({
      entity: "product",
      fields: ["id", "title", "variants.id", "variants.title", "variants.sku"],
      filters: { status: "published" },
    }),
    query.graph({
      entity: "region",
      fields: ["id", "name", "currency_code", "countries.iso_2", "countries.display_name", "payment_providers.id", "payment_providers.is_enabled"],
    }),
  ])

  const productOptions = (products.data as { id: string; title: string; variants?: { id: string; title?: string | null; sku?: string | null }[] | null }[])
    .flatMap((product) =>
      (product.variants ?? []).map((variant) => ({
        variant_id: variant.id,
        title: [product.title, variant.title].filter((part) => part && part !== "Default variant").join(" · "),
        sku: variant.sku ?? null,
      }))
    )
    .sort((a, b) => a.title.localeCompare(b.title))

  type RegionRow = {
    currency_code?: string | null
    countries?: { iso_2?: string | null; display_name?: string | null }[] | null
    payment_providers?: ({ id?: string | null; is_enabled?: boolean | null } | null)[] | null
  }
  const countries = (regions.data as RegionRow[])
    .flatMap((region) => {
      // The payment methods turned on where this country is sold, for the form's "Payment method".
      const paymentProviders = (region.payment_providers ?? []).flatMap((provider) => (provider?.id && provider.is_enabled !== false ? [provider.id] : []))
      return (region.countries ?? []).flatMap((country) =>
        country.iso_2
          ? [{ code: country.iso_2, name: country.display_name ?? country.iso_2.toUpperCase(), currency_code: region.currency_code ?? null, payment_providers: paymentProviders }]
          : []
      )
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  res.setHeader("Cache-Control", "private, no-store")
  res.json({
    links: (carts.data as LinkCart[]).map(toLink),
    truncated: carts.data.length >= LINK_LIMIT,
    products: productOptions,
    countries,
  })
}

/** POST /admin/order-links: makes the cart and returns its link. */
export async function POST(req: MedusaRequest<AdminCreateOrderLinkBody>, res: MedusaResponse) {
  const { result } = await createOrderLinkWorkflow(req.scope).run({ input: req.validatedBody })
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "cart", fields: LINK_FIELDS, filters: { id: result.cart_id } })
  res.status(201).json({ link: toLink(data[0] as LinkCart) })
}
