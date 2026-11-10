/**
 * The community's topic spaces. The storefront holds their names, descriptions and which library
 * categories belong to each (src/lib/community/topics.ts); keep the ids in sync.
 */
export const FORUM_TOPICS = ["general", "weight", "recovery", "mind", "skin", "longevity", "hormones"] as const
export type ForumTopic = (typeof FORUM_TOPICS)[number]
