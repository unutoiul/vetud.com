import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight, Envelope, Link as LinkIcon, Phone, Trash } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  IconButton,
  Input,
  Label,
  Select,
  StatusBadge,
  Table,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useCallback, useEffect, useMemo, useState } from "react"

/**
 * Admin > Order links (owner, 2026-11-25). For customers who order on WhatsApp: pick the items, make
 * a link and send it. The customer opens it, adds their own email, phone, address and payment in the
 * normal checkout, and gets the usual order email with the payment details. The order and its
 * address then show under Orders, and here.
 */

type Step = "cart" | "contact" | "address" | "delivery" | "payment" | "placed"

type OrderLink = {
  cart_id: string
  url: string
  created_at: string
  last_activity_at: string
  country_code: string | null
  customer_name: string | null
  whatsapp: string | null
  email: string | null
  note: string | null
  payment_provider: string | null
  step: Step
  ship_to: string | null
  currency_code: string | null
  total: number
  items: { title: string; quantity: number }[]
  order: { id: string; display_id: number | null } | null
}

type ProductOption = { variant_id: string; title: string; sku: string | null }
type CountryOption = { code: string; name: string; currency_code: string | null; payment_providers: string[] }
type Data = { links: OrderLink[]; truncated: boolean; products: ProductOption[]; countries: CountryOption[] }
type Line = { variant_id: string; title: string; quantity: number }
type Address = {
  first_name: string
  last_name: string
  company: string
  address_1: string
  address_2: string
  city: string
  province: string
  postal_code: string
  country_code: string
}
/** `payment` is a provider id, or "" when the customer chooses. */
type Form = {
  country: string
  promo: string
  whatsapp: string
  email: string
  note: string
  payment: string
  address: Address
}

const EMPTY_ADDRESS: Address = {
  first_name: "",
  last_name: "",
  company: "",
  address_1: "",
  address_2: "",
  city: "",
  province: "",
  postal_code: "",
  country_code: "",
}
const EMPTY_FORM: Form = {
  country: "",
  promo: "",
  whatsapp: "",
  email: "",
  note: "",
  payment: "",
  address: EMPTY_ADDRESS,
}
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * The payment methods the shop's checkout can take, by provider id, in the order they're offered
 * here. Methods turned on in a region but not listed here can't be pre-selected.
 */
const PAYMENT_METHODS: Record<string, string> = {
  pp_system_default: "Bank transfer / invoice",
  pp_nmi_primary: "Card or bank account",
  pp_paygate_card: "Card (PayGate)",
  pp_makepay_makepay: "Cryptocurrency (MakePay)",
  pp_paygate_crypto: "Cryptocurrency (PayGate)",
}
// The select can't hold an empty value, so "the customer chooses" has its own.
const CUSTOMER_CHOOSES = "customer"

/** The methods that can be pre-selected for a country: turned on there and known to the checkout. */
function paymentOptions(countries: CountryOption[] | undefined, code: string) {
  const enabled = countries?.find((country) => country.code === code)?.payment_providers ?? []
  return Object.keys(PAYMENT_METHODS).filter((id) => enabled.includes(id))
}

const STEPS: Record<Step, { label: string; color: "grey" | "blue" | "purple" | "orange" | "green" }> = {
  cart: { label: "Waiting for details", color: "grey" },
  contact: { label: "Gave email", color: "blue" },
  address: { label: "Added address", color: "blue" },
  delivery: { label: "Chose delivery", color: "purple" },
  payment: { label: "Chose payment", color: "orange" },
  placed: { label: "Ordered", color: "green" },
}

// The dashboard is served by the backend, so the admin session cookie authenticates these calls.
async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  })
  const body = (await response.json().catch(() => null)) as { message?: string } | null
  if (!response.ok) throw new Error(body?.message ?? `Request failed (${response.status})`)
  return body as T
}

function money(value: number, currency: string | null) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: (currency || "usd").toUpperCase() }).format(
      value,
    )
  } catch {
    return `${value.toFixed(2)} ${(currency || "").toUpperCase()}`
  }
}

const showDate = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })

/** The text sent with the link, on WhatsApp, by SMS or by email. */
function message(link: OrderLink) {
  const hello = link.customer_name ? `Hi ${link.customer_name.split(" ")[0]},` : "Hi,"
  const next = link.ship_to
    ? "Open it, check your details and choose how to pay."
    : "Open it, add your delivery details and choose how to pay."
  return `${hello} here is your VETUD order: ${link.url}\n\n${next} You'll get a confirmation email with the payment details.`
}

/** wa.me wants the number with country code and digits only; without one, WhatsApp lets you pick the chat. */
function whatsappHref(link: OrderLink) {
  const digits = (link.whatsapp ?? "").replace(/\D/g, "")
  return `https://wa.me/${digits}?text=${encodeURIComponent(message(link))}`
}

/** "?&body=" works on both iPhone and Android. */
function smsHref(link: OrderLink) {
  const number = (link.whatsapp ?? "").replace(/[^\d+]/g, "")
  return `sms:${number}?&body=${encodeURIComponent(message(link))}`
}

function emailHref(link: OrderLink) {
  return `mailto:${encodeURIComponent(link.email ?? "")}?subject=${encodeURIComponent("Your VETUD order")}&body=${encodeURIComponent(message(link))}`
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success("Link copied")
  } catch {
    toast.error("Couldn't copy. Select the link and copy it by hand.")
  }
}

function SendButtons({ link }: { link: OrderLink }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="small" variant="secondary" onClick={() => void copy(link.url)}>
        <LinkIcon /> Copy link
      </Button>
      <Button type="button" size="small" variant="secondary" asChild>
        <a href={whatsappHref(link)} target="_blank" rel="noreferrer">
          <ChatBubbleLeftRight /> WhatsApp
        </a>
      </Button>
      <Button type="button" size="small" variant="secondary" asChild>
        <a href={smsHref(link)}>
          <Phone /> SMS
        </a>
      </Button>
      <Button type="button" size="small" variant="secondary" asChild>
        <a href={emailHref(link)}>
          <Envelope /> Email
        </a>
      </Button>
    </div>
  )
}

const OrderLinksPage = () => {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Form>(EMPTY_FORM)
  const [lines, setLines] = useState<Line[]>([])
  const [search, setSearch] = useState("")
  const [created, setCreated] = useState<OrderLink | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await adminFetch<Data>("/admin/order-links"))
    } catch (error) {
      toast.error("Couldn't load order links", { description: (error as Error).message })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const matches = useMemo(() => {
    const words = search.toLowerCase().split(/\s+/).filter(Boolean)
    if (!words.length || !data) return []
    return data.products
      .filter((product) => !lines.some((line) => line.variant_id === product.variant_id))
      .filter((product) => words.every((word) => `${product.title} ${product.sku ?? ""}`.toLowerCase().includes(word)))
      .slice(0, 8)
  }, [search, data, lines])

  const payments = paymentOptions(data?.countries, form.country)

  const update = (patch: Partial<Form>) => setForm((current) => ({ ...current, ...patch }))
  // Another country can have other payment methods; drop a choice that isn't offered there.
  const chooseCountry = (country: string) =>
    setForm((current) => ({
      ...current,
      country,
      payment: paymentOptions(data?.countries, country).includes(current.payment) ? current.payment : "",
    }))
  const updateAddress = (patch: Partial<Address>) =>
    setForm((current) => ({ ...current, address: { ...current.address, ...patch } }))
  const addLine = (product: ProductOption) => {
    setLines((current) => [...current, { variant_id: product.variant_id, title: product.title, quantity: 1 }])
    setSearch("")
  }
  const setQuantity = (variantId: string, value: string) => {
    const quantity = Math.max(1, Math.min(100, Math.floor(Number(value) || 1)))
    setLines((current) => current.map((line) => (line.variant_id === variantId ? { ...line, quantity } : line)))
  }
  const removeLine = (variantId: string) =>
    setLines((current) => current.filter((line) => line.variant_id !== variantId))

  const create = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.country) return toast.error("Choose the customer's country")
    if (!lines.length) return toast.error("Add at least one product")
    const email = form.email.trim()
    if (email && !EMAIL.test(email)) return toast.error("Check the email address")
    const address = Object.fromEntries(
      Object.entries(form.address).map(([key, value]) => [key, value.trim()]),
    ) as Address
    const hasAddress = Object.entries(address).some(([key, value]) => key !== "country_code" && Boolean(value))
    if (hasAddress) {
      const missing = [
        !address.first_name && "first name",
        !address.last_name && "last name",
        !address.address_1 && "street address",
        !address.city && "city",
        !address.postal_code && "postal code",
        !form.whatsapp.trim() && "phone (the courier needs it)",
      ].filter(Boolean)
      if (missing.length)
        return toast.error("Complete the delivery address", { description: `Missing: ${missing.join(", ")}.` })
    }
    setSaving(true)
    try {
      const shippingAddress = hasAddress
        ? Object.fromEntries(
            Object.entries({
              ...address,
              country_code: address.country_code || form.country,
              phone: form.whatsapp.trim(),
            }).filter(([, value]) => value),
          )
        : null
      const body = JSON.stringify({
        country_code: form.country,
        items: lines.map(({ variant_id, quantity }) => ({ variant_id, quantity })),
        ...(form.promo.trim() ? { promo_code: form.promo.trim() } : {}),
        ...(hasAddress ? { customer_name: `${address.first_name} ${address.last_name}` } : {}),
        ...(form.whatsapp.trim() ? { whatsapp: form.whatsapp.trim() } : {}),
        ...(email ? { email } : {}),
        ...(shippingAddress ? { shipping_address: shippingAddress } : {}),
        ...(form.note.trim() ? { note: form.note.trim() } : {}),
        ...(form.payment ? { payment_provider: form.payment } : {}),
      })
      const { link } = await adminFetch<{ link: OrderLink }>("/admin/order-links", { method: "POST", body })
      setCreated(link)
      setForm((current) => ({ ...EMPTY_FORM, country: current.country }))
      setLines([])
      toast.success("Order link ready", { description: "Send it with one of the buttons." })
      await load()
    } catch (error) {
      toast.error("Couldn't make the link", { description: (error as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Order links</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            For customers who order on WhatsApp. Choose the products, add the customer&apos;s details, make a link and
            send it. With email and address filled in, the link opens the checkout at payment: the customer checks the
            details, chooses how to pay and places the order. They get the usual confirmation email with the payment
            details, and you get the order alert with their address. Shop prices apply; add a discount code if you
            agreed one.
          </Text>
        </div>

        <form onSubmit={(event) => void create(event)} className="flex flex-col gap-y-4 px-6 py-4">
          <Heading level="h3">New order link</Heading>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-y-2">
              <Label size="small" weight="plus">
                Customer&apos;s country
              </Label>
              <Select value={form.country} onValueChange={chooseCountry}>
                <Select.Trigger>
                  <Select.Value placeholder="Choose a country" />
                </Select.Trigger>
                <Select.Content>
                  {(data?.countries ?? []).map((country) => (
                    <Select.Item key={country.code} value={country.code}>
                      {country.name} ({(country.currency_code ?? "").toUpperCase()})
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
              <Text size="xsmall" className="text-ui-fg-muted">
                Sets the currency and prices. They can still ship elsewhere at checkout.
              </Text>
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="link-promo" size="small" weight="plus">
                Discount code (optional)
              </Label>
              <Input
                id="link-promo"
                value={form.promo}
                maxLength={60}
                onChange={(event) => update({ promo: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label size="small" weight="plus">
                Payment method
              </Label>
              <Select
                value={form.payment || CUSTOMER_CHOOSES}
                onValueChange={(value) => update({ payment: value === CUSTOMER_CHOOSES ? "" : value })}
                disabled={!form.country}
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value={CUSTOMER_CHOOSES}>The customer chooses</Select.Item>
                  {payments.map((id) => (
                    <Select.Item key={id} value={id}>
                      {PAYMENT_METHODS[id]}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
              <Text size="xsmall" className="text-ui-fg-muted">
                {form.country
                  ? "Already chosen when the customer opens the checkout. They can still switch, for example if their card is declined."
                  : "Choose the country first: it decides which methods are available."}
              </Text>
            </div>
          </div>

          <div className="flex flex-col gap-y-2">
            <Label htmlFor="link-search" size="small" weight="plus">
              Products
            </Label>
            <Input
              id="link-search"
              type="search"
              placeholder="Search by name or SKU"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {matches.length ? (
              <div className="flex flex-col divide-y rounded-md border">
                {matches.map((product) => (
                  <button
                    key={product.variant_id}
                    type="button"
                    onClick={() => addLine(product)}
                    className="flex justify-between gap-x-4 px-3 py-2 text-left hover:bg-ui-bg-base-hover"
                  >
                    <Text size="small">{product.title}</Text>
                    <Text size="xsmall" className="text-ui-fg-muted">
                      {product.sku}
                    </Text>
                  </button>
                ))}
              </div>
            ) : search.trim() && data ? (
              <Text size="xsmall" className="text-ui-fg-muted">
                No product matches.
              </Text>
            ) : null}
            {lines.length ? (
              <div className="flex flex-col gap-y-2">
                {lines.map((line) => (
                  <div key={line.variant_id} className="flex items-center gap-x-3">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      step={1}
                      value={line.quantity}
                      onChange={(event) => setQuantity(line.variant_id, event.target.value)}
                      className="w-20"
                      aria-label={`Quantity of ${line.title}`}
                    />
                    <Text size="small" className="flex-1">
                      {line.title}
                    </Text>
                    <IconButton
                      type="button"
                      size="small"
                      variant="transparent"
                      onClick={() => removeLine(line.variant_id)}
                      aria-label={`Remove ${line.title}`}
                    >
                      <Trash />
                    </IconButton>
                  </div>
                ))}
              </div>
            ) : (
              <Text size="xsmall" className="text-ui-fg-muted">
                Search and click a product to add it.
              </Text>
            )}
          </div>

          <div className="flex flex-col gap-y-1">
            <Heading level="h3">Customer</Heading>
            <Text size="xsmall" className="text-ui-fg-muted">
              Fill in the email and delivery address and the customer goes straight to payment: they only check the
              details and pay. Leave them empty and the customer fills them in.
            </Text>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="link-email" size="small" weight="plus">
                Email
              </Label>
              <Input
                id="link-email"
                value={form.email}
                type="email"
                maxLength={254}
                placeholder="For the confirmation and bill"
                onChange={(event) => update({ email: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="link-whatsapp" size="small" weight="plus">
                WhatsApp / phone
              </Label>
              <Input
                id="link-whatsapp"
                value={form.whatsapp}
                maxLength={40}
                placeholder="+46 70 …"
                onChange={(event) => update({ whatsapp: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="link-first" size="small" weight="plus">
                First name
              </Label>
              <Input
                id="link-first"
                value={form.address.first_name}
                maxLength={120}
                onChange={(event) => updateAddress({ first_name: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="link-last" size="small" weight="plus">
                Last name
              </Label>
              <Input
                id="link-last"
                value={form.address.last_name}
                maxLength={120}
                onChange={(event) => updateAddress({ last_name: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="link-address1" size="small" weight="plus">
                Street address
              </Label>
              <Input
                id="link-address1"
                value={form.address.address_1}
                maxLength={240}
                onChange={(event) => updateAddress({ address_1: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="link-address2" size="small" weight="plus">
                Apartment, floor (optional)
              </Label>
              <Input
                id="link-address2"
                value={form.address.address_2}
                maxLength={240}
                onChange={(event) => updateAddress({ address_2: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="link-postal" size="small" weight="plus">
                Postal code
              </Label>
              <Input
                id="link-postal"
                value={form.address.postal_code}
                maxLength={24}
                onChange={(event) => updateAddress({ postal_code: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="link-city" size="small" weight="plus">
                City
              </Label>
              <Input
                id="link-city"
                value={form.address.city}
                maxLength={120}
                onChange={(event) => updateAddress({ city: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="link-province" size="small" weight="plus">
                State / province (if needed)
              </Label>
              <Input
                id="link-province"
                value={form.address.province}
                maxLength={80}
                onChange={(event) => updateAddress({ province: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label size="small" weight="plus">
                Ship to
              </Label>
              <Select
                value={form.address.country_code || form.country}
                onValueChange={(country_code) => updateAddress({ country_code })}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Same as the customer's country" />
                </Select.Trigger>
                <Select.Content>
                  {(data?.countries ?? []).map((country) => (
                    <Select.Item key={country.code} value={country.code}>
                      {country.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="link-note" size="small" weight="plus">
              Note for you (optional)
            </Label>
            <Textarea
              id="link-note"
              value={form.note}
              maxLength={500}
              rows={2}
              onChange={(event) => update({ note: event.target.value })}
            />
            <Text size="xsmall" className="text-ui-fg-muted">
              Only shown here. The customer doesn&apos;t see it.
            </Text>
          </div>
          <div>
            <Button type="submit" size="small" isLoading={saving}>
              Make link
            </Button>
          </div>
        </form>

        {created ? (
          <div className="flex flex-col gap-y-3 px-6 py-4">
            <Heading level="h3">Link for {created.customer_name ?? "your customer"}</Heading>
            <Input readOnly value={created.url} onFocus={(event) => event.target.select()} aria-label="Order link" />
            <Text size="small" className="text-ui-fg-subtle">
              {created.items.map((item) => `${item.quantity} × ${item.title}`).join(", ")}:{" "}
              {money(created.total, created.currency_code)} before delivery.
              {created.payment_provider
                ? ` Payment: ${PAYMENT_METHODS[created.payment_provider] ?? created.payment_provider} (already chosen).`
                : ""}
            </Text>
            <SendButtons link={created} />
          </div>
        ) : null}
      </Container>

      <Container className="p-0">
        <div className="px-6 py-4">
          <Heading level="h3">Links sent</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Newest first. Once a customer orders, the order number links to the order with their address.
          </Text>
        </div>
        {loading && !data ? (
          <Text size="small" className="px-6 pb-4 text-ui-fg-muted">
            Loading…
          </Text>
        ) : !data?.links.length ? (
          <Text size="small" className="px-6 pb-4 text-ui-fg-muted">
            No order links yet.
          </Text>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Made</Table.HeaderCell>
                <Table.HeaderCell>Customer</Table.HeaderCell>
                <Table.HeaderCell>Items</Table.HeaderCell>
                <Table.HeaderCell>Total</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Send again</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data.links.map((link) => (
                <Table.Row key={link.cart_id}>
                  <Table.Cell>{showDate(link.created_at)}</Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col py-2">
                      <Text size="small">{link.customer_name ?? "—"}</Text>
                      <Text size="xsmall" className="text-ui-fg-muted">
                        {[link.whatsapp, link.email].filter(Boolean).join(" · ")}
                      </Text>
                      {link.note ? (
                        <Text size="xsmall" className="text-ui-fg-muted">
                          {link.note}
                        </Text>
                      ) : null}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="whitespace-normal">
                      {link.items.map((item) => `${item.quantity} × ${item.title}`).join(", ")}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>{money(link.total, link.currency_code)}</Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col gap-y-1 py-2">
                      <StatusBadge color={STEPS[link.step].color}>{STEPS[link.step].label}</StatusBadge>
                      {link.order ? (
                        <a href={`/app/orders/${link.order.id}`} className="text-ui-fg-interactive txt-compact-small">
                          Order #{link.order.display_id ?? link.order.id}
                        </a>
                      ) : null}
                      {link.ship_to ? (
                        <Text size="xsmall" className="text-ui-fg-muted">
                          {link.ship_to}
                        </Text>
                      ) : null}
                      {link.payment_provider ? (
                        <Text size="xsmall" className="text-ui-fg-muted">
                          Pay by: {PAYMENT_METHODS[link.payment_provider] ?? link.payment_provider}
                        </Text>
                      ) : null}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {link.order ? (
                      <Text size="xsmall" className="text-ui-fg-muted">
                        Done
                      </Text>
                    ) : (
                      <SendButtons link={link} />
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
        {data?.truncated ? (
          <Text size="xsmall" className="px-6 pb-4 text-ui-fg-muted">
            Showing the newest 200 links.
          </Text>
        ) : null}
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Order links",
  icon: LinkIcon,
})

export default OrderLinksPage
