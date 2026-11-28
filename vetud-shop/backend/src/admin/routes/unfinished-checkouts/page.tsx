import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ShoppingCart } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Table, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"

type Step = "cart" | "contact" | "address" | "delivery" | "payment" | "placed"

type Checkout = {
  id: string
  email: string | null
  name: string | null
  member: boolean
  step: Step
  started_at: string
  last_activity_at: string
  place: string | null
  delivery: string | null
  payment: string | null
  currency_code: string | null
  value: number
  items: { title: string; quantity: number }[]
}

type Report = { days: number; since: string; truncated: boolean; funnel: Record<Step, number>; checkouts: Checkout[] }

const STEPS: Step[] = ["cart", "contact", "address", "delivery", "payment", "placed"]

const STEP_LABELS: Record<Step, string> = {
  cart: "Cart only",
  contact: "Gave email",
  address: "Added address",
  delivery: "Chose delivery",
  payment: "Chose payment",
  placed: "Ordered",
}

const STEP_COLORS: Record<Step, "grey" | "blue" | "purple" | "orange" | "green"> = {
  cart: "grey",
  contact: "blue",
  address: "blue",
  delivery: "purple",
  payment: "orange",
  placed: "green",
}

const PAYMENT_NAMES: Record<string, string> = {
  pp_system_default: "Bank transfer",
  pp_makepay_makepay: "Crypto (MakePay)",
}

const RANGES = [
  { days: 1, label: "Last 24 hours" },
  { days: 7, label: "Last 7 days" },
  { days: 30, label: "Last 30 days" },
]

// The dashboard is served by the backend, so the admin session cookie authenticates these calls.
async function adminFetch<T>(path: string): Promise<T> {
  const response = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" } })
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

function ago(iso: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours} h ago`
  return `${Math.round(hours / 24)} days ago`
}

/** Shoppers who started an order and didn't finish, and where they stopped. */
const UnfinishedCheckoutsPage = () => {
  const [days, setDays] = useState(7)
  const [report, setReport] = useState<Report | null>(null)
  const [failure, setFailure] = useState<{ days: number; message: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    adminFetch<Report>(`/admin/unfinished-checkouts?days=${days}`)
      .then((data) => {
        if (!cancelled) setReport(data)
      })
      .catch((error: Error) => {
        if (!cancelled) setFailure({ days, message: error.message })
      })
    return () => {
      cancelled = true
    }
  }, [days])

  const current = report?.days === days ? report : null
  const error = failure?.days === days && !current ? failure.message : null
  const started = current?.funnel.cart ?? 0

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-4">
        <div>
          <Heading level="h1">Unfinished checkouts</Heading>
          <Text size="small" className="text-ui-fg-subtle mt-1 max-w-2xl">
            Shoppers who added products but didn't place the order. Each checkout step is saved as they complete it, so
            you can see where they stopped.
          </Text>
        </div>
        <div className="flex gap-2">
          {RANGES.map((range) => (
            <Button
              key={range.days}
              size="small"
              variant={range.days === days ? "primary" : "secondary"}
              onClick={() => setDays(range.days)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-6 py-4 md:grid-cols-6">
        {STEPS.map((step) => {
          const count = current?.funnel[step] ?? 0
          return (
            <div key={step} className="rounded-lg border border-ui-border-base p-3">
              <Text size="xsmall" className="text-ui-fg-subtle">
                {STEP_LABELS[step]}
              </Text>
              <Text size="xlarge" weight="plus">
                {current ? count : "…"}
              </Text>
              <Text size="xsmall" className="text-ui-fg-muted">
                {current && started ? `${Math.round((count / started) * 100)}% of carts` : " "}
              </Text>
            </div>
          )
        })}
      </div>

      <div className="px-6 py-4">
        {error ? (
          <Text className="text-ui-fg-error">{error}</Text>
        ) : !current ? (
          <Text className="text-ui-fg-subtle">Loading…</Text>
        ) : !current.checkouts.length ? (
          <Text className="text-ui-fg-subtle">No unfinished checkouts in this period.</Text>
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Last activity</Table.HeaderCell>
                  <Table.HeaderCell>Shopper</Table.HeaderCell>
                  <Table.HeaderCell>Stopped at</Table.HeaderCell>
                  <Table.HeaderCell>Products</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">Value</Table.HeaderCell>
                  <Table.HeaderCell>Delivery to</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {current.checkouts.map((checkout) => (
                  <Table.Row key={checkout.id}>
                    <Table.Cell title={new Date(checkout.last_activity_at).toLocaleString()}>
                      {ago(checkout.last_activity_at)}
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-col">
                        <span>{checkout.name ?? (checkout.email ? "" : "Unknown")}</span>
                        {checkout.email ? (
                          <a className="text-ui-fg-interactive" href={`mailto:${checkout.email}`}>
                            {checkout.email}
                          </a>
                        ) : (
                          <span className="text-ui-fg-muted">No email yet</span>
                        )}
                        {checkout.email ? (
                          <span>
                            <Badge size="2xsmall" color={checkout.member ? "green" : "grey"}>
                              {checkout.member ? "Member" : "Guest"}
                            </Badge>
                          </span>
                        ) : null}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge size="xsmall" color={STEP_COLORS[checkout.step]}>
                        {STEP_LABELS[checkout.step]}
                      </Badge>
                      {checkout.payment ? (
                        <Text size="xsmall" className="text-ui-fg-subtle mt-1">
                          {PAYMENT_NAMES[checkout.payment] ?? checkout.payment}
                        </Text>
                      ) : null}
                    </Table.Cell>
                    <Table.Cell>
                      {checkout.items.map((item, index) => (
                        <Text key={index} size="small">
                          {item.quantity} × {item.title}
                        </Text>
                      ))}
                    </Table.Cell>
                    <Table.Cell className="text-right">{money(checkout.value, checkout.currency_code)}</Table.Cell>
                    <Table.Cell>{checkout.place ?? "—"}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
            {current.truncated ? (
              <Text size="small" className="text-ui-fg-subtle mt-3">
                Showing the most recent 1,000 carts. Choose a shorter period to see everything.
              </Text>
            ) : null}
          </>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Unfinished checkouts",
  icon: ShoppingCart,
})

export default UnfinishedCheckoutsPage
