import { defineRouteConfig } from "@medusajs/admin-sdk"
import { RocketLaunch } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Input, Label, Table, Text, toast, usePrompt } from "@medusajs/ui"
import { useEffect, useState } from "react"

type RegionRow = { name: string; currency_code: string; threshold: number | null; in_sync: boolean }
type FreeShipping = { amount_usd: number | null; standard_options: number; regions: RegionRow[] }

// The dashboard is served by the backend, so the admin session cookie authenticates these calls.
async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...init })
  const body = await response.json().catch(() => null) as { message?: string } | null
  if (!response.ok) throw new Error(body?.message ?? `Request failed (${response.status})`)
  return body as T
}

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(value)
  } catch {
    return `${value} ${currency.toUpperCase()}`
  }
}

/** One dollar amount for free Standard shipping; every region gets it in its own currency. */
const FreeShippingPage = () => {
  const [data, setData] = useState<FreeShipping | null>(null)
  const [amount, setAmount] = useState("")
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const prompt = usePrompt()

  useEffect(() => {
    let cancelled = false
    adminFetch<FreeShipping>("/admin/free-shipping")
      .then((result) => {
        if (cancelled) return
        setData(result)
        setAmount(result.amount_usd ? String(result.amount_usd) : "")
      })
      .catch((error: Error) => { if (!cancelled) setLoadError(error.message) })
    return () => { cancelled = true }
  }, [])

  const save = async (amountUsd: number | null) => {
    setSaving(true)
    try {
      const result = await adminFetch<FreeShipping>("/admin/free-shipping", { method: "POST", body: JSON.stringify({ amount_usd: amountUsd }) })
      setData(result)
      setAmount(result.amount_usd ? String(result.amount_usd) : "")
      toast.success(amountUsd ? `Free standard shipping from ${money(amountUsd, "usd")}` : "Free shipping is off")
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = Number(amount.replace(",", "."))
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter an amount in US dollars, for example 250.")
      return
    }
    await save(Math.round(value * 100) / 100)
  }

  const turnOff = async () => {
    const confirmed = await prompt({ title: "Turn off free shipping?", description: "Standard shipping will be charged on every order, and the progress bar disappears from the shop.", confirmText: "Turn off", cancelText: "Keep it" })
    if (confirmed) await save(null)
  }

  const outOfSync = data?.regions.filter((region) => !region.in_sync) ?? []

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h1">Free shipping</Heading>
        <Text size="small" className="text-ui-fg-subtle mt-1 max-w-2xl">
          Standard shipping is free once the products in the cart reach this amount. Set it in US dollars: every region gets it in its own currency, converted at today's rate and rounded. The shop's progress bar and product pages show it straight away.
        </Text>
      </div>

      <form onSubmit={submit} className="flex flex-wrap items-end gap-3 px-6 py-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="free-shipping-amount">Free from (USD)</Label>
          <Input id="free-shipping-amount" type="number" min="1" step="1" placeholder="250" value={amount} onChange={(event) => setAmount(event.target.value)} className="w-40" />
        </div>
        <Button type="submit" isLoading={saving} disabled={!data}>Save</Button>
        {data?.amount_usd ? <Button type="button" variant="secondary" disabled={saving} onClick={() => void turnOff()}>Turn off free shipping</Button> : null}
        <Text size="small" className="text-ui-fg-subtle">
          {data ? (data.amount_usd ? `Now: free from ${money(data.amount_usd, "usd")}.` : "Now: off. Standard shipping is always charged.") : loadError ?? "Loading…"}
        </Text>
      </form>

      {data && outOfSync.length ? (
        <div className="px-6 py-4">
          <Text className="text-ui-fg-error">
            {outOfSync.length === 1 ? "One region shows" : `${outOfSync.length} regions show`} a free-shipping amount that checkout doesn't apply, or the other way round. Press Save to set them all again.
          </Text>
        </div>
      ) : null}

      {data ? (
        <div className="px-6 py-4">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Region</Table.HeaderCell>
                <Table.HeaderCell>Free from</Table.HeaderCell>
                <Table.HeaderCell>At checkout</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data.regions.map((region) => (
                <Table.Row key={region.currency_code + region.name}>
                  <Table.Cell>{region.name}</Table.Cell>
                  <Table.Cell>{region.threshold ? money(region.threshold, region.currency_code) : "Not free"}</Table.Cell>
                  <Table.Cell>
                    <Badge size="2xsmall" color={region.in_sync ? "green" : "red"}>{region.in_sync ? "Matches" : "Doesn't match"}</Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      ) : null}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Free shipping",
  icon: RocketLaunch,
})

export default FreeShippingPage
