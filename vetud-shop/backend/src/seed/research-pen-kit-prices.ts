/** Initial US retail prices selected from the research recorded in output/research/us-peptide-prices-2026-10-13.md. */
export const US_PEN_KIT_PRICING_REVISION = "us-10-20-40mg-2026-10-13-v1"
export const US_PEN_KIT_PRICING_DATE = "2026-10-13"
export const PEN_KIT_AMOUNTS = [10, 20, 40] as const

export const US_PEN_KIT_PRICES = [
  {
    handle: "semaglutide",
    skuPrefix: "VTD-SEMA",
    prices: { 10: 69, 20: 99, 40: 169 },
    sources: [
      "https://nextdaypeptides.com/product/glp1-sema-research-compound",
      "https://www.progressionlabs.org/compounds/semaglutide",
      "https://www.jonezielabs.com/products/semaglutide.html",
    ],
    note: "10/20 mg benchmarked against US research vial retail; 40 mg estimated with a volume discount. Pen kit pricing is an initial estimate.",
  },
  {
    handle: "tirzepatide",
    skuPrefix: "VTD-TIRZ",
    prices: { 10: 79, 20: 119, 40: 179 },
    sources: [
      "https://nextdaypeptides.com/product/glp2-tirz-research-compound",
      "https://www.progressionlabs.org/compounds/tirzepatide",
      "https://uspeptidelabs.co/products/tirzepatide",
    ],
    note: "Benchmarked against US single-vial retail listings, with rounded pen kit starting prices.",
  },
  {
    handle: "retatrutide",
    skuPrefix: "VTD-RETA",
    prices: { 10: 99, 20: 159, 40: 229 },
    sources: [
      "https://nextdaypeptides.com/product/glp3-reta-research-compound",
      "https://www.progressionlabs.org/compounds/retatrutide",
      "https://uspeptidelabs.co/products/retatrutide",
      "https://penpeptidesusa.com/",
    ],
    note: "10/20 mg near US vial retail benchmarks; 40 mg includes a modest kit premium over the lower vial benchmarks and falls within the observed pen listing range.",
  },
]
