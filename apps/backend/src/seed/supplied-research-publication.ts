/**
 * Storefront copy and specifications for the three supplied pen kits, approved by the owner on
 * 2026-10-30: publish with zero stock at the proposed USD prices (other currencies are converted
 * from USD) and describe the kits like the existing pen kits (99% purity).
 * Tesamorelin joined on 2026-11-02 on the same terms, at the owner's price of $198.
 */
export const SUPPLIED_PUBLICATION_REVISION = "supplied-pen-kits-published-2026-11-02-v2"

type PublishedKit = {
  handle: "nad-plus" | "melanotan" | "ipamorelin" | "tesamorelin"
  name: string
  amount: string
  /** NAD+ is a coenzyme, not a peptide, so its copy says "powder". */
  peptide: boolean
  note?: string
  /** Learn library profiles for a handle that differs from the profile slug. */
  learn?: string[]
}

const KITS: PublishedKit[] = [
  { handle: "nad-plus", name: "NAD+", amount: "1000 mg", peptide: false, note: "NAD+ (nicotinamide adenine dinucleotide) is a coenzyme, not a peptide.", learn: ["nad"] },
  { handle: "melanotan", name: "Melanotan", amount: "10 mg", peptide: true },
  { handle: "ipamorelin", name: "Ipamorelin", amount: "5 mg", peptide: true },
  { handle: "tesamorelin", name: "Tesamorelin", amount: "20 mg", peptide: true },
]

const STORAGE = "Follow the manufacturer's batch-specific storage temperature and conditions."
const HANDLING = "Keep in original packaging, away from direct sunlight and excess heat."
const STABILITY = "Freeze-dried powder and BAC water remain in separate chambers until preparation. See the batch expiry date for shelf life."

export const SUPPLIED_PUBLICATIONS = KITS.map((kit) => {
  const powder = kit.peptide ? "peptide powder" : "powder"
  const ingredients = `${kit.name} ${powder}; bacteriostatic water (BAC water) in a separate chamber. Refer to the manufacturer's batch specification for the complete formulation.`
  return {
    handle: kit.handle,
    subtitle: `Freeze-dried ${kit.peptide ? "peptide" : "powder"} · dual-chamber pen · ${kit.amount}`,
    description: [
      `VETUD ${kit.name} is supplied as freeze-dried ${powder} in a dual-chamber pen. One chamber holds the powder and the other holds bacteriostatic water (BAC water), keeping them separate until preparation. ${kit.amount} total amount.${kit.note ? ` ${kit.note}` : ""}`,
      "99% purity. Lab tested for purity. Each kit includes one pen, 12 disposable needles and an instruction booklet.",
      `Ingredients: ${ingredients}`,
      `Storage and stability: Follow the manufacturer's batch-specific temperature instructions and expiry date. ${HANDLING} ${STABILITY}`,
      "For research use only.",
    ].join("\n\n"),
    metadata: {
      form: "Dual-chamber pen kit",
      purity: "99%",
      testing: "Lab tested for purity",
      storage: STORAGE,
      handling: HANDLING,
      stability: STABILITY,
      ingredients,
      features: [kit.peptide ? "Freeze-dried peptide" : "Freeze-dried powder", "Dual-chamber pen", "Separate BAC water"],
      contents: `1 pen (${kit.amount}); 12 disposable needles; 1 instruction booklet`,
      available_amounts: kit.amount,
      pricing_status: "approved",
      specifications_status: "owner_approved",
      inventory_status: "awaiting_stock",
      publication_revision: SUPPLIED_PUBLICATION_REVISION,
      ...(kit.learn ? { learn_peptides: kit.learn } : {}),
    },
  }
})

