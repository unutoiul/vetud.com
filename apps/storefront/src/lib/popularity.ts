import type { HttpTypes } from "@medusajs/types"

/**
 * How well known each product is, 0–100, for the shop's "Relevance" order (most known first).
 * These are editorial estimates, last reviewed 2026-11-04, from public prominence: approved
 * medicines and their brand names, news coverage, and how often people search for and talk about
 * them. They are not sales figures. Lab supplies sit low so the peptides come first, and products
 * missing here score 0 and sort last. A number in a product's `popularity` metadata (set in Admin)
 * overrides the one here.
 */
export const POPULARITY: Record<string, number> = {
  semaglutide: 100, // Ozempic, Wegovy, Rybelsus
  tirzepatide: 96, // Mounjaro, Zepbound
  retatrutide: 90, // the most watched next weight-loss medicine
  "bpc-157": 88, // the best-known research peptide; FDA compounding news in 2025–26
  "nad-plus": 78, // mainstream wellness (IV drips, supplements)
  "ghk-cu": 74, // copper peptide skincare
  "tb-500": 74, // usually named together with BPC-157
  glutathione: 72, // mainstream supplement
  "melanotan-ii": 66, // "tanning peptide", widely covered for its risks
  "cjc-1295-ipamorelin": 64,
  "wolverine-blend": 62, // BPC-157 + TB-500
  "pt-141": 60, // bremelanotide (Vyleesi)
  ipamorelin: 58,
  "mots-c": 56,
  semax: 52,
  tesamorelin: 52, // Egrifta
  "aod-9604": 48,
  selank: 46,
  "igf-1-lr3": 46,
  "glow-blend": 44,
  "klow-blend": 44,
  "5-amino-1mq": 42,
  "ss-31": 40, // elamipretide (Forzinity)
  kpv: 36,
  dsip: 34,
  "melanotan-i": 32, // afamelanotide (Scenesse)
  "decapeptide-12": 30, // skin-brightening cosmetic peptide (Lumixyl)
  "ara-290": 22,
  "bacteriostatic-water": 20,
  "u-100-syringes": 15,
}

export function popularity(product: Pick<HttpTypes.StoreProduct, "handle" | "metadata">): number {
  const override = Number(product.metadata?.popularity)
  if (product.metadata?.popularity != null && Number.isFinite(override)) return override
  return POPULARITY[product.handle ?? ""] ?? 0
}
