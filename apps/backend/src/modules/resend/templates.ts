import { formatCurrency } from "../../lib/currencies"

/**
 * The emails live as published templates in Resend (Dashboard > Templates), in the VETUD style.
 * This file only turns each notification's data into that template's variables; the template
 * IDs are in template-ids.ts. Change wording or layout in Resend, not here.
 */
export const EmailTemplates = {
  ORDER_PLACED: "order-placed",
  ORDER_PLACED_ADMIN: "order-placed-admin",
  SHIPMENT_CREATED: "shipment-created",
  CONTACT_MESSAGE: "contact-message",
  PASSWORD_RESET: "password-reset",
  NEWSLETTER_OFFER: "newsletter-offer",
  NEWSLETTER_WELCOME: "newsletter-welcome",
  CUSTOMER_WELCOME: "customer-welcome",
  USER_INVITE: "user-invite",
  PAYMENT_RECEIVED: "payment-received",
  ORDER_CANCELED: "order-canceled",
  REFUND_ISSUED: "refund-issued",
  ORDER_DELIVERED: "order-delivered",
  RETURN_RECEIVED: "return-received",
} as const

export type EmailTemplate = (typeof EmailTemplates)[keyof typeof EmailTemplates]

type Amount = number | string | null | undefined

type EmailAddress = {
  first_name?: string | null
  last_name?: string | null
  company?: string | null
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  country_code?: string | null
}

type EmailOrder = {
  id: string
  display_id?: number | string | null
  email?: string | null
  currency_code: string
  item_total?: Amount
  item_subtotal?: Amount
  shipping_total?: Amount
  shipping_subtotal?: Amount
  tax_total?: Amount
  discount_total?: Amount
  total?: Amount
  items?: {
    title?: string | null
    product_title?: string | null
    variant_title?: string | null
    quantity: number | string
    total?: Amount
  }[] | null
  shipping_address?: EmailAddress | null
  shipping_methods?: { name?: string | null }[] | null
}

type Offer = { code: string; headline: string; description: string | null; discount: string; ends_at: string | null }

// Notification data, as built by the send-* workflows.
type Data = {
  order: EmailOrder
  storefront_url: string
  admin_url: string
  manual_payment: boolean
  payment_summary: string
  payment_instructions: string
  bank_details: string
  admin_payment_action: string
  tracking: { tracking_number?: string | null; tracking_url?: string | null }[]
  name: string
  email: string
  subject: string | null
  order_number: string | null
  message: string
  reset_url: string
  offer: Offer | null
  shop_url: string
  unsubscribe_url: string
  first_name: string | null
  invite_url: string
  expires_at: string | null
  amount: Amount
  paid: boolean
  items: { title: string; quantity: number | string }[]
  refund_amount: Amount
}

/** Values are inserted into the template HTML as-is, so customer input must be escaped. */
function escape(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
}

function money(amount: Amount, currencyCode: string) {
  const value = Number(amount ?? 0)
  return formatCurrency(Number.isFinite(value) ? value : 0, currencyCode)
}

/** Matches the order number shown in Medusa Admin, so payment references are easy to reconcile. */
function orderNumber(order: Pick<EmailOrder, "id" | "display_id">) {
  return order.display_id ? `#${order.display_id}` : order.id
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }).format(new Date(value)) + " UTC"
}

/** The order summary block shared by the order emails. Multi-line values use line breaks. */
function orderVariables(order: EmailOrder) {
  const currency = order.currency_code
  const shipping = order.shipping_subtotal ?? order.shipping_total
  const totals: [string, string][] = [
    ["Subtotal", money(order.item_subtotal ?? order.item_total, currency)],
    ["Shipping", Number(shipping ?? 0) === 0 ? "Free" : money(shipping, currency)],
  ]
  if (Number(order.discount_total ?? 0) > 0) totals.push(["Discount", money(-Number(order.discount_total), currency)])
  if (Number(order.tax_total ?? 0) > 0) totals.push(["Tax", money(order.tax_total, currency)])
  const address = order.shipping_address
  const shipTo = address
    ? [
        [address.first_name, address.last_name].filter(Boolean).join(" "),
        address.company,
        address.address_1,
        address.address_2,
        [address.postal_code, address.city, address.province].filter(Boolean).join(" "),
        address.country_code?.toUpperCase(),
      ].filter(Boolean).join("\n")
    : ""

  return {
    ORDER_NUMBER: orderNumber(order),
    ITEMS: (order.items ?? [])
      .map((item) => {
        const title = [item.product_title ?? item.title, item.variant_title].filter(Boolean).join(" · ")
        return `${title} × ${item.quantity} · ${money(item.total, currency)}`
      })
      .join("\n"),
    TOTALS_LABELS: totals.map(([label]) => label).join("\n"),
    TOTALS_VALUES: totals.map(([, value]) => value).join("\n"),
    ORDER_TOTAL: money(order.total, currency),
    SHIP_TO: shipTo,
    SHIPPING_METHOD: order.shipping_methods?.[0]?.name ?? "",
  }
}

type Builder = (data: Data) => { template?: EmailTemplate; variables: Record<string, string> }

const builders: Record<string, Builder> = {
  [EmailTemplates.ORDER_PLACED]: (data) => ({
    variables: {
      ...orderVariables(data.order),
      NAME_SUFFIX: data.order.shipping_address?.first_name ? `, ${data.order.shipping_address.first_name}` : "",
      PAYMENT_SUMMARY: data.payment_summary ?? "We have received your order and reserved the stock. It ships as soon as your payment is confirmed.",
      PAYMENT_DETAILS: data.manual_payment === false
        ? "No further payment step is needed by email."
        : [
            `Amount due: ${money(data.order.total, data.order.currency_code)}`,
            `Payment reference: ${orderNumber(data.order)}`,
            data.payment_instructions,
            data.bank_details?.split(" | ").join("\n"),
          ].filter(Boolean).join("\n"),
      STOREFRONT_URL: data.storefront_url,
    },
  }),
  [EmailTemplates.ORDER_PLACED_ADMIN]: (data) => ({
    variables: {
      ...orderVariables(data.order),
      CUSTOMER_EMAIL: data.order.email ?? "A customer",
      ADMIN_ACTION: data.admin_payment_action ?? "Check the selected payment method and confirm payment before shipping.",
      ADMIN_ORDER_URL: `${data.admin_url}/app/orders/${data.order.id}`,
    },
  }),
  [EmailTemplates.SHIPMENT_CREATED]: (data) => {
    const labels = data.tracking.filter((label) => label.tracking_number || label.tracking_url)
    return {
      variables: {
        ...orderVariables(data.order),
        TRACKING: labels.map((label) => label.tracking_number || label.tracking_url).join("\n") || "Tracking details will follow.",
        TRACK_URL: labels.find((label) => label.tracking_url)?.tracking_url ?? `${data.storefront_url}/tracking`,
        STOREFRONT_URL: data.storefront_url,
      },
    }
  },
  [EmailTemplates.CONTACT_MESSAGE]: (data) => ({
    variables: {
      SUBJECT: data.subject || "New message",
      NAME: data.name,
      SENDER_EMAIL: data.email,
      ORDER_REF: data.order_number ? ` · Order ${data.order_number}` : "",
      MESSAGE: data.message,
    },
  }),
  [EmailTemplates.PASSWORD_RESET]: (data) => ({ variables: { RESET_URL: data.reset_url } }),
  [EmailTemplates.NEWSLETTER_OFFER]: (data) => {
    const links = { SHOP_URL: data.shop_url, UNSUBSCRIBE_LINK: data.unsubscribe_url }
    if (!data.offer) return { template: EmailTemplates.NEWSLETTER_WELCOME, variables: links }
    return {
      variables: {
        ...links,
        HEADLINE: data.offer.headline || "VETUD offers",
        DISCOUNT: data.offer.discount,
        CODE: data.offer.code,
        VALIDITY: data.offer.ends_at ? `Valid until ${dateTime(data.offer.ends_at)}.` : "",
        DESCRIPTION: data.offer.description ?? "",
      },
    }
  },
  [EmailTemplates.CUSTOMER_WELCOME]: (data) => ({
    variables: { NAME_SUFFIX: data.first_name ? `, ${data.first_name}` : "", STOREFRONT_URL: data.storefront_url },
  }),
  [EmailTemplates.USER_INVITE]: (data) => ({
    variables: {
      INVITE_URL: data.invite_url,
      EXPIRY_NOTE: data.expires_at ? `The link expires on ${dateTime(data.expires_at)}.` : "",
    },
  }),
  [EmailTemplates.PAYMENT_RECEIVED]: (data) => ({
    variables: {
      ...orderVariables(data.order),
      PAYMENT_LINE: data.manual_payment
        ? "Your bank transfer has arrived and has been matched to your order."
        : "Your payment has been confirmed.",
      AMOUNT: money(data.amount, data.order.currency_code),
      STOREFRONT_URL: data.storefront_url,
    },
  }),
  [EmailTemplates.ORDER_CANCELED]: (data) => ({
    variables: {
      ...orderVariables(data.order),
      PAYMENT_NOTE: data.paid
        ? "Your payment will be refunded to the original payment method. We'll email you when the refund is issued."
        : "No payment was taken for this order. If you had already sent a bank transfer, reply to this email and we'll return it.",
      STOREFRONT_URL: data.storefront_url,
    },
  }),
  [EmailTemplates.REFUND_ISSUED]: (data) => ({
    variables: {
      ORDER_NUMBER: orderNumber(data.order),
      REFUND_AMOUNT: money(data.amount, data.order.currency_code),
      ORDER_TOTAL: money(data.order.total, data.order.currency_code),
      STOREFRONT_URL: data.storefront_url,
    },
  }),
  [EmailTemplates.ORDER_DELIVERED]: (data) => ({
    variables: { ...orderVariables(data.order), STOREFRONT_URL: data.storefront_url },
  }),
  [EmailTemplates.RETURN_RECEIVED]: (data) => {
    const refund = Number(data.refund_amount ?? 0)
    return {
      variables: {
        ORDER_NUMBER: orderNumber(data.order),
        RETURN_ITEMS: data.items.map((item) => `${item.title} × ${item.quantity}`).join("\n"),
        REFUND_LINE: refund > 0
          ? `Refund due: ${money(refund, data.order.currency_code)}. We'll email you when it's issued.`
          : "We'll be in touch if anything else is needed.",
        STOREFRONT_URL: data.storefront_url,
      },
    }
  },
}

/** The Resend template to use and its escaped variables, or null for an unknown template. */
export function buildEmail(template: string, data: Record<string, unknown>) {
  const builder = builders[template]
  if (!builder) return null
  const { template: resolved = template as EmailTemplate, variables } = builder(data as Data)
  const contact = template === EmailTemplates.CONTACT_MESSAGE
  return {
    template: resolved,
    variables: Object.fromEntries(Object.entries(variables).map(([key, value]) => [key, escape(value)])),
    // A subject is plain text, so the customer's own words are sent unescaped there.
    subject: contact ? `Contact form: ${variables.SUBJECT} (${variables.NAME})` : undefined,
    replyTo: contact ? (data as Data).email : undefined,
  }
}
