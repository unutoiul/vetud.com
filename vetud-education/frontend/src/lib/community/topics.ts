import type { IconName } from "@/components/brand/Icon"
import type { CategoryId } from "@/content/learn/categories"
import { getPeptide } from "@/content/learn/peptides"

export type TopicId = "general" | "weight" | "recovery" | "mind" | "skin" | "longevity" | "hormones"

export type CommunityTopic = {
  id: TopicId
  name: string
  description: string
  icon: IconName
  /** Library categories whose peptides belong here; a post about one of them lands in this topic. */
  categories: CategoryId[]
  /** Ideas for a first post, shown while the topic is quiet. */
  prompts: string[]
}

/**
 * The community's topic spaces: a General space and six broad areas. Each library category maps
 * into one, so a post's peptide picks its topic. The ids match the backend (lib/forum/topics.ts).
 */
export const COMMUNITY_TOPICS: CommunityTopic[] = [
  {
    id: "general", name: "General", icon: "molecule", categories: ["medicines"],
    description: "Getting started, reading studies, side effects, regulation and news.",
    prompts: ["How do I tell a good study from a weak one?", "What does an FDA advisory meeting actually decide?", "How do I describe a side effect clearly?"],
  },
  {
    id: "weight", name: "Weight & metabolism", icon: "scale", categories: ["weight"],
    description: "GLP-1 medicines, new weight-loss research and the trials behind them.",
    prompts: ["What did the newest retatrutide trial measure?", "Why do trial results differ from what people report?", "What is known about keeping weight off afterwards?"],
  },
  {
    id: "recovery", name: "Recovery & performance", icon: "mountain", categories: ["recovery", "growth"],
    description: "Tissue repair, BPC-157 and TB-500, and growth-hormone research.",
    prompts: ["What do the BPC-157 animal studies actually show?", "Which recovery peptides have any human data?", "How do growth-hormone secretagogues differ?"],
  },
  {
    id: "mind", name: "Sleep, calm & focus", icon: "brain", categories: ["sleep", "calm", "focus"],
    description: "Selank, Semax, DSIP and the research on sleep, stress and focus.",
    prompts: ["What is the evidence for Selank outside Russia?", "How are sleep studies measured?", "Semax: what has been tested in people?"],
  },
  {
    id: "skin", name: "Skin, hair & tanning", icon: "leaf", categories: ["skin", "pigmentation", "hair"],
    description: "Copper peptides, skincare research and the tanning peptides.",
    prompts: ["What do the GHK-Cu skin studies show?", "Why do doctors warn about tanning peptides?", "Copper peptides for hair: what is known?"],
  },
  {
    id: "longevity", name: "Longevity & energy", icon: "clock", categories: ["longevity", "energy", "immune"],
    description: "NAD+, MOTS-c, SS-31 and research on ageing, energy and immunity.",
    prompts: ["What has NAD+ research found in people?", "How strong is the evidence for MOTS-c?", "What does SS-31's approval cover?"],
  },
  {
    id: "hormones", name: "Hormones & sexual health", icon: "heart", categories: ["intimacy", "fertility"],
    description: "PT-141, kisspeptin, fertility hormones and their research.",
    prompts: ["How does PT-141 differ from other treatments?", "What is kisspeptin being studied for?", "Which fertility hormones are approved medicines?"],
  },
]

export const TOPIC_IDS = COMMUNITY_TOPICS.map((topic) => topic.id)

export function getTopic(id?: string | null) {
  return COMMUNITY_TOPICS.find((topic) => topic.id === id)
}

/** The topic a peptide's posts belong to: the one holding its library category, else General. */
export function topicForPeptide(slug?: string | null): TopicId {
  const category = slug ? getPeptide(slug)?.category : undefined
  return COMMUNITY_TOPICS.find((topic) => category && topic.categories.includes(category))?.id ?? "general"
}
