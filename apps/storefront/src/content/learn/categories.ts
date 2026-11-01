import type { IconName } from "@/components/brand/Icon"

export type CategoryId =
  | "weight" | "skin" | "pigmentation" | "recovery" | "energy" | "growth"
  | "focus" | "calm" | "longevity" | "intimacy" | "immune" | "medicines"

/** Short, plain topic names, in the order readers browse them. */
export const CATEGORIES: { id: CategoryId; name: string; blurb: string; icon: IconName }[] = [
  { id: "weight", name: "Weight management", blurb: "Copies of gut hormones that curb appetite and help control blood sugar.", icon: "scale" },
  { id: "skin", name: "Skin & copper peptides", blurb: "Peptides used in skin care, led by copper peptide GHK-Cu.", icon: "leaf" },
  { id: "pigmentation", name: "Pigmentation", blurb: "The tanning peptides, one approved and one that doctors warn about.", icon: "sun" },
  { id: "recovery", name: "Recovery & mobility", blurb: "Peptides studied for repairing tendons, muscles, skin and the gut.", icon: "plus" },
  { id: "energy", name: "Energy & metabolism", blurb: "Molecules studied for how cells make and use energy.", icon: "molecule" },
  { id: "growth", name: "Performance & growth", blurb: "Signals that tell the body to release more of its own growth hormone.", icon: "mountain" },
  { id: "focus", name: "Concentration & focus", blurb: "Nasal-spray peptides studied for memory, focus and stroke recovery.", icon: "brain" },
  { id: "calm", name: "Calm & balance", blurb: "Peptides studied for anxiety and stress.", icon: "wave" },
  { id: "longevity", name: "Longevity", blurb: "Peptides studied for how cells age.", icon: "clock" },
  { id: "intimacy", name: "Sexual health", blurb: "Peptides that act on desire in the brain.", icon: "heart" },
  { id: "immune", name: "Immune support", blurb: "Signals that help switch on the body's defenses.", icon: "shield" },
  { id: "medicines", name: "Classic medicines", blurb: "Long-established peptide medicines, and a good reference for what “approved” means.", icon: "flask" },
]

export type StatusId = "approved" | "approved-elsewhere" | "former" | "trials" | "early"

/** How far each peptide has got, in plain words. Tone picks the badge color. */
export const STATUSES: Record<StatusId, { label: string; explain: string; tone: "good" | "info" | "neutral" | "caution" }> = {
  approved: { label: "Approved medicine", explain: "A medicines regulator, such as the FDA in the US or the EMA in Europe, has approved it for specific uses.", tone: "good" },
  "approved-elsewhere": { label: "Approved in some countries", explain: "Approved as a medicine in some countries, but not in the US, UK or EU.", tone: "info" },
  former: { label: "Formerly approved", explain: "It was once an approved medicine but is no longer sold as one.", tone: "neutral" },
  trials: { label: "In human trials", explain: "Tested in people, but not approved as a medicine.", tone: "info" },
  early: { label: "Early research", explain: "Mostly studied in cells and animals, with little or no proper testing in people.", tone: "caution" },
}

export function getCategory(id: CategoryId) {
  return CATEGORIES.find((category) => category.id === id)!
}
