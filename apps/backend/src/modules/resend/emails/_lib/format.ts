import type { EmailAddress, EmailOrder } from "./types"

export function formatMoney(amount: number | string | null | undefined, currencyCode: string) {
  const value = Number(amount ?? 0)
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(Number.isFinite(value) ? value : 0)
}

/** Matches the order number shown in Medusa Admin, so payment references are easy to reconcile. */
export function orderNumber(order: Pick<EmailOrder, "id" | "display_id">) {
  return order.display_id ? `#${order.display_id}` : order.id
}

export function addressLines(address?: EmailAddress | null): string[] {
  if (!address) {
    return []
  }
  const name = [address.first_name, address.last_name].filter(Boolean).join(" ")
  const cityLine = [address.postal_code, address.city, address.province].filter(Boolean).join(" ")
  return [
    name,
    address.company,
    address.address_1,
    address.address_2,
    cityLine,
    address.country_code?.toUpperCase(),
  ].filter((line): line is string => Boolean(line))
}
