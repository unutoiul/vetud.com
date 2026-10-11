export type ProductLot = {
  lot: string
  date?: string
  purity?: string
  coa_url?: string
}

/**
 * Lots are stored in product metadata under `lots` so they can be edited in Medusa Admin's
 * metadata editor, which only handles plain strings. The format is one lot per entry,
 * separated by ";" or new lines, with "|" between fields:
 *
 *   VTD01-2609A|2026-09|99.4%|https://example.com/coa.pdf; VTD01-2607B|2026-07|99.1%
 *
 * A JSON array of `{ lot, date, purity, coa_url }` objects is accepted as well.
 */
export function parseLots(value: unknown): ProductLot[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {}))
      .filter((entry) => typeof entry.lot === "string" && entry.lot.trim())
      .map((entry) => ({
        lot: String(entry.lot).trim(),
        date: typeof entry.date === "string" ? entry.date : undefined,
        purity: typeof entry.purity === "string" ? entry.purity : undefined,
        coa_url: typeof entry.coa_url === "string" ? entry.coa_url : undefined,
      }))
  }

  if (typeof value !== "string") {
    return []
  }

  return value
    .split(/[;\n]/)
    .map((entry) => entry.split("|").map((part) => part.trim()))
    .filter(([lot]) => Boolean(lot))
    .map(([lot, date, purity, coa_url]) => ({
      lot,
      date: date || undefined,
      purity: purity || undefined,
      coa_url: coa_url || undefined,
    }))
}

export function formatLots(lots: ProductLot[]): string {
  return lots
    .map((lot) => [lot.lot, lot.date ?? "", lot.purity ?? "", lot.coa_url ?? ""].join("|").replace(/\|+$/, ""))
    .join("; ")
}
