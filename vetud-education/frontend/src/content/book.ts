import type { IconName } from "@/components/brand/Icon"
import { getPeptide } from "./learn/peptides"
import type { StatusId } from "./learn/categories"

/**
 * The 32 peptides in "Peptides Explained", the $4.99 PDF book (owner, 2026-11-27), as listed on its
 * page (/book). Keep this list the same as the PDF in Google Drive. Each line is a plain, one-breath
 * description for readers with no science background: no doses, no promises, no personal use.
 * Approval status comes from the matching guide (content/learn), so the two never disagree.
 */
export type BookPeptide = { slug: string; name: string; description: string }
export type BookTopic = { id: string; title: string; icon: IconName; peptides: BookPeptide[] }

export const BOOK_TOPICS: BookTopic[] = [
  {
    id: "weight",
    title: "Weight and appetite",
    icon: "scale",
    peptides: [
      { slug: "semaglutide", name: "Semaglutide", description: "A copy of a gut hormone that helps you feel full. It is the medicine in Ozempic and Wegovy." },
      { slug: "tirzepatide", name: "Tirzepatide", description: "Works on two gut hormones at once. Sold as Mounjaro and Zepbound, with some of the biggest weight losses seen in trials." },
      { slug: "retatrutide", name: "Retatrutide", description: "An experimental medicine that works on three hormone signals. Still in trials, with very large weight losses so far." },
      { slug: "liraglutide", name: "Liraglutide", description: "The older, once-a-day cousin of semaglutide, and the first medicine of its kind approved for weight management." },
      { slug: "cagrilintide", name: "Cagrilintide", description: "A copy of amylin, another hormone that tells you you're full. Being tested together with semaglutide." },
      { slug: "survodutide", name: "Survodutide", description: "An experimental medicine with two hormone signals, studied for weight and for fat in the liver." },
      { slug: "mazdutide", name: "Mazdutide", description: "A two-signal weight medicine approved in China after a 48-week trial." },
      { slug: "aod-9604", name: "AOD-9604", description: "A small piece of growth hormone made to help burn fat. It was tested in people but never approved." },
    ],
  },
  {
    id: "recovery",
    title: "Healing and recovery",
    icon: "heart",
    peptides: [
      { slug: "bpc-157", name: "BPC-157", description: "A popular \"healing\" peptide. Lots of research in animals, almost none in people." },
      { slug: "tb-500", name: "TB-500", description: "A small piece of a natural repair protein. Popular for recovery, but barely tested in people." },
      { slug: "kpv", name: "KPV", description: "A tiny peptide, just three building blocks long, studied for calming inflammation in the gut." },
      { slug: "ara-290", name: "ARA-290", description: "A small peptide made from part of the hormone EPO, studied for protecting damaged nerves." },
    ],
  },
  {
    id: "growth",
    title: "Growth hormone",
    icon: "wave",
    peptides: [
      { slug: "ipamorelin", name: "Ipamorelin", description: "Nudges the body to release more of its own growth hormone." },
      { slug: "cjc-1295", name: "CJC-1295", description: "A long-lasting copy of the brain signal that switches on growth hormone." },
      { slug: "sermorelin", name: "Sermorelin", description: "A short copy of the same brain signal. It was once a prescription medicine for children." },
      { slug: "tesamorelin", name: "Tesamorelin", description: "An approved medicine that raises growth hormone, used to reduce the deep fat around the organs." },
      { slug: "ghrp-2", name: "GHRP-2", description: "A growth-hormone releaser used in Japan as a test of how well the pituitary gland works." },
      { slug: "ghrp-6", name: "GHRP-6", description: "One of the first growth-hormone releasers. It works through the same switch as the hunger hormone." },
      { slug: "igf-1-lr3", name: "IGF-1 LR3", description: "A long-lasting lab version of IGF-1, the hormone that carries out much of growth hormone's work." },
    ],
  },
  {
    id: "brain",
    title: "Brain, mood and sleep",
    icon: "brain",
    peptides: [
      { slug: "selank", name: "Selank", description: "A nasal-spray peptide developed in Russia and studied for anxiety." },
      { slug: "semax", name: "Semax", description: "A Russian nasal-spray peptide used after strokes and studied for focus and memory." },
      { slug: "dsip", name: "DSIP", description: "A small brain peptide named for deep sleep. Fifty years on, what it really does is still unclear." },
    ],
  },
  {
    id: "skin",
    title: "Skin and hair",
    icon: "sun",
    peptides: [
      { slug: "ghk-cu", name: "GHK-Cu", description: "A copper-carrying peptide the body makes, used in skin care for its anti-aging claims." },
      { slug: "ahk-cu", name: "AHK-Cu", description: "A close cousin of GHK-Cu, studied for hair growth." },
      { slug: "matrixyl", name: "Matrixyl", description: "A common anti-wrinkle peptide in face creams, tested against a plain moisturizer." },
      { slug: "argireline", name: "Argireline", description: "The \"Botox in a jar\" peptide: a cream ingredient meant to soften expression lines." },
    ],
  },
  {
    id: "energy",
    title: "Energy and aging",
    icon: "flask",
    peptides: [
      { slug: "mots-c", name: "MOTS-c", description: "A peptide made inside mitochondria, the cell's power plants, studied for metabolism." },
      { slug: "ss-31", name: "SS-31", description: "Also called elamipretide: the first approved medicine aimed at the mitochondria." },
      { slug: "epitalon", name: "Epitalon", description: "A four-building-block peptide studied for aging, mostly in cells and animals." },
      { slug: "glutathione", name: "Glutathione", description: "An antioxidant every cell makes from three building blocks. As a supplement, studies disagree." },
    ],
  },
  {
    id: "intimacy",
    title: "Desire and immunity",
    icon: "shield",
    peptides: [
      { slug: "pt-141", name: "PT-141", description: "Also called bremelanotide: an approved medicine that works in the brain to increase sexual desire." },
      { slug: "thymosin-alpha-1", name: "Thymosin alpha-1", description: "A natural immune messenger from the thymus gland, used as a medicine in some countries." },
    ],
  },
]

export const BOOK_PEPTIDE_COUNT = BOOK_TOPICS.reduce((total, topic) => total + topic.peptides.length, 0)

/** The approval status shown on each peptide, taken from its guide. */
export const bookPeptideStatus = (slug: string): StatusId | undefined => getPeptide(slug)?.status
