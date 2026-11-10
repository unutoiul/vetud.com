import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ReceiptPercent } from "@medusajs/icons"
import { Button, Container, Heading, Input, Label, StatusBadge, Switch, Table, Text, toast, usePrompt } from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"

type SaleState = "live" | "scheduled" | "ended" | "off"

type Sale = {
  id: string
  title: string
  percent_off: number
  status: "active" | "draft"
  starts_at: string | null
  ends_at: string | null
  state: SaleState
}

type Form = { id: string | null; title: string; percent: string; startsAt: string; endsAt: string; active: boolean }

const NEW_SALE: Form = { id: null, title: "Christmas sale", percent: "30", startsAt: "", endsAt: "", active: true }

const STATES: Record<SaleState, { label: string; color: "green" | "blue" | "grey" | "orange" }> = {
  live: { label: "Live", color: "green" },
  scheduled: { label: "Scheduled", color: "blue" },
  ended: { label: "Ended", color: "grey" },
  off: { label: "Off", color: "orange" },
}

const TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

// The dashboard is served by the backend, so the admin session cookie authenticates these calls.
async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...init })
  const body = await response.json().catch(() => null) as { message?: string } | null
  if (!response.ok) throw new Error(body?.message ?? `Request failed (${response.status})`)
  return body as T
}

/** "2026-12-01T00:00" in the browser's time zone, for a datetime-local input. */
function toLocalInput(iso: string | null) {
  if (!iso) return ""
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null)

const showDate = (iso: string | null, empty: string) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : empty

const SalesPage = () => {
  const prompt = usePrompt()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Form>(NEW_SALE)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminFetch<{ sales: Sale[] }>("/admin/storewide-sales")
      setSales(data.sales)
    } catch (error) {
      toast.error("Couldn't load the sales", { description: (error as Error).message })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const update = (patch: Partial<Form>) => setForm(current => ({ ...current, ...patch }))

  const edit = (sale: Sale) => {
    setForm({ id: sale.id, title: sale.title, percent: String(sale.percent_off), startsAt: toLocalInput(sale.starts_at), endsAt: toLocalInput(sale.ends_at), active: sale.status === "active" })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    const percent = Number(form.percent)
    if (!form.title.trim()) return toast.error("Give the sale a name")
    if (!Number.isInteger(percent) || percent < 1 || percent > 90) return toast.error("The discount must be a whole number from 1 to 90")
    const startsAt = fromLocalInput(form.startsAt)
    const endsAt = fromLocalInput(form.endsAt)
    if (startsAt && endsAt && endsAt <= startsAt) return toast.error("The sale must end after it starts")
    setSaving(true)
    try {
      const body = JSON.stringify({ title: form.title.trim(), percent_off: percent, starts_at: startsAt, ends_at: endsAt, status: form.active ? "active" : "draft" })
      await adminFetch(form.id ? `/admin/storewide-sales/${encodeURIComponent(form.id)}` : "/admin/storewide-sales", { method: "POST", body })
      toast.success(form.id ? "Sale updated" : "Sale created", { description: "The store shows the new prices within a few minutes." })
      setForm(NEW_SALE)
      await load()
    } catch (error) {
      toast.error("Couldn't save the sale", { description: (error as Error).message })
    } finally {
      setSaving(false)
    }
  }

  const remove = async (sale: Sale) => {
    const confirmed = await prompt({
      title: `Delete "${sale.title}"?`,
      description: "Every product goes back to its regular price. To pause the sale instead, edit it and switch it off.",
      confirmText: "Delete",
      cancelText: "Cancel",
    })
    if (!confirmed) return
    try {
      await adminFetch(`/admin/storewide-sales/${encodeURIComponent(sale.id)}`, { method: "DELETE" })
      toast.success("Sale deleted")
      if (form.id === sale.id) setForm(NEW_SALE)
      await load()
    } catch (error) {
      toast.error("Couldn't delete the sale", { description: (error as Error).message })
    }
  }

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Sales</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Take a percentage off every product, in every currency. Shoppers see the regular price crossed out next to the sale price, and checkout charges the sale price. Discount codes still apply on top. New products and changed prices are included automatically within 15 minutes.
          </Text>
        </div>
        <form onSubmit={event => void save(event)} className="flex flex-col gap-y-4 px-6 py-4">
          <Heading level="h3">{form.id ? "Edit sale" : "New sale"}</Heading>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="sale-title" size="small" weight="plus">Name</Label>
              <Input id="sale-title" value={form.title} maxLength={120} onChange={event => update({ title: event.target.value })} />
              <Text size="xsmall" className="text-ui-fg-muted">For you; shoppers see the discount, not the name.</Text>
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="sale-percent" size="small" weight="plus">Discount (% off)</Label>
              <Input id="sale-percent" type="number" min={1} max={90} step={1} value={form.percent} onChange={event => update({ percent: event.target.value })} />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="sale-starts" size="small" weight="plus">Starts</Label>
              <Input id="sale-starts" type="datetime-local" value={form.startsAt} onChange={event => update({ startsAt: event.target.value })} />
              <Text size="xsmall" className="text-ui-fg-muted">Leave empty to start as soon as you save.</Text>
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="sale-ends" size="small" weight="plus">Ends</Label>
              <Input id="sale-ends" type="datetime-local" value={form.endsAt} onChange={event => update({ endsAt: event.target.value })} />
              <Text size="xsmall" className="text-ui-fg-muted">Leave empty to run until you switch it off.</Text>
            </div>
          </div>
          <Text size="xsmall" className="text-ui-fg-muted">Times are in your computer&apos;s time zone ({TIME_ZONE}).</Text>
          <div className="flex items-center gap-x-2">
            <Switch id="sale-active" checked={form.active} onCheckedChange={active => update({ active })} />
            <Label htmlFor="sale-active" size="small">On. Switch off to pause the sale without deleting it.</Label>
          </div>
          <div className="flex gap-x-2">
            <Button type="submit" size="small" isLoading={saving}>{form.id ? "Save changes" : "Create sale"}</Button>
            {form.id ? <Button type="button" size="small" variant="secondary" onClick={() => setForm(NEW_SALE)}>Cancel</Button> : null}
          </div>
        </form>
      </Container>

      <Container className="p-0">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Discount</Table.HeaderCell>
              <Table.HeaderCell>Starts</Table.HeaderCell>
              <Table.HeaderCell>Ends</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {sales.map(sale => (
              <Table.Row key={sale.id}>
                <Table.Cell>{sale.title}</Table.Cell>
                <Table.Cell>{sale.percent_off}% off</Table.Cell>
                <Table.Cell className="whitespace-nowrap">{showDate(sale.starts_at, "Right away")}</Table.Cell>
                <Table.Cell className="whitespace-nowrap">{showDate(sale.ends_at, "No end date")}</Table.Cell>
                <Table.Cell><StatusBadge color={STATES[sale.state].color}>{STATES[sale.state].label}</StatusBadge></Table.Cell>
                <Table.Cell>
                  <div className="flex justify-end gap-x-2">
                    <Button size="small" variant="secondary" onClick={() => edit(sale)}>Edit</Button>
                    <Button size="small" variant="danger" onClick={() => void remove(sale)}>Delete</Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        {!loading && !sales.length ? <Text className="px-6 py-4 text-ui-fg-subtle">No sales yet.</Text> : null}
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Sales",
  icon: ReceiptPercent,
})

export default SalesPage
