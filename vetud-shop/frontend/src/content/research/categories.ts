import type { IconName } from "@/components/brand/Icon"

export type CategoryId =
  | "weight" | "skin" | "pigmentation" | "hair" | "recovery" | "energy" | "growth"
  | "focus" | "calm" | "sleep" | "longevity" | "intimacy" | "fertility" | "immune" | "medicines"

/** Short, plain topic names, in the order readers browse them. */
export const CATEGORIES: { id: CategoryId; name: string; blurb: string; icon: IconName }[] = [
  { id: "weight", name: "Weight management", blurb: "Medicines and experimental compounds studied for appetite, body weight and body fat.", icon: "scale" },
  { id: "skin", name: "Skin & copper peptides", blurb: "Peptides used in skin care, led by copper peptide GHK-Cu.", icon: "leaf" },
  { id: "pigmentation", name: "Pigmentation", blurb: "Peptides that change skin color: the tanning peptides, and a skin-care peptide studied for dark patches.", icon: "sun" },
  { id: "hair", name: "Hair", blurb: "Copper peptides studied for hair growth.", icon: "leaf" },
  { id: "recovery", name: "Recovery & mobility", blurb: "Peptides studied for repairing tendons, muscles, skin and the gut.", icon: "plus" },
  { id: "energy", name: "Energy & metabolism", blurb: "Molecules studied for how cells make and use energy.", icon: "molecule" },
  { id: "growth", name: "Performance & growth", blurb: "Signals that tell the body to release more of its own growth hormone.", icon: "mountain" },
  { id: "focus", name: "Concentration & focus", blurb: "Nasal-spray peptides studied for memory, focus and stroke recovery.", icon: "brain" },
  { id: "calm", name: "Calm & balance", blurb: "Peptides studied for anxiety and stress.", icon: "wave" },
  { id: "sleep", name: "Sleep", blurb: "Peptides studied for sleep.", icon: "clock" },
  { id: "longevity", name: "Longevity", blurb: "Peptides studied for how cells age.", icon: "clock" },
  { id: "intimacy", name: "Sexual health", blurb: "Peptides that act on desire in the brain.", icon: "heart" },
  { id: "fertility", name: "Fertility & hormones", blurb: "Reproductive hormones, from approved fertility medicines to research.", icon: "molecule" },
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

/** The evidence ladder, weakest to strongest. Shown with the compound's step highlighted. */
export const EVIDENCE_STEPS = [
  { id: "cells", label: "Cells", explain: "Tested on cells in a dish" },
  { id: "animals", label: "Animals", explain: "Tested in animals such as rats and mice" },
  { id: "small-human", label: "Small human studies", explain: "Tried in small groups of people" },
  { id: "large-trials", label: "Large trials", explain: "Tested in large, controlled trials in people" },
  { id: "approved", label: "Approved medicine", explain: "Approved by a medicines regulator for specific uses" },
] as const
export type Evidence = (typeof EVIDENCE_STEPS)[number]["id"]

export function getCategory(id: CategoryId) {
  return CATEGORIES.find((category) => category.id === id)!
}
