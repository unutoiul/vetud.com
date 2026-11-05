import { z } from "@medusajs/framework/zod"
import { FORUM_TOPICS } from "../../../lib/forum/topics"

/** Storefront library slugs ("bpc-157") and product handles share this shape. */
export const ForumSlug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80)
/** As printed on packaging, e.g. "VTD01-2609A". */
export const ForumLot = z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9][A-Za-z0-9 _./-]*$/)
const ForumId = z.string().trim().min(1).max(64)
/** Upload IDs from POST /store/forum/uploads. */
const Images = z.array(ForumId).max(4).optional()

const commaList = (item: z.ZodString, max: number) =>
  z.string().trim().max(2000)
    .transform(value => value.split(",").map(entry => entry.trim()).filter(Boolean))
    .pipe(z.array(item).max(max))

const ThreadKind = z.enum(["discussion", "question"])
const ForumTopic = z.enum(FORUM_TOPICS)
const Offset = z.coerce.number().int().min(0).default(0)

export const StoreForumThreadsQuery = z.object({
  kind: ThreadKind.optional(),
  topic: ForumTopic.optional(),
  peptide: commaList(ForumSlug, 50).optional(),
  lot: ForumLot.optional(),
  product: ForumSlug.optional(),
  author: ForumSlug.optional(),
  sort: z.enum(["latest", "top", "unanswered"]).default("latest"),
  q: z.string().trim().max(80).optional(),
  offset: Offset,
  limit: z.coerce.number().int().min(1).max(50).default(20),
}).strict()

export const StoreForumThreadQuery = z.object({
  offset: Offset,
  limit: z.coerce.number().int().min(1).max(100).default(50),
}).strict()

export const StoreCreateForumThreadSchema = z.object({
  kind: ThreadKind,
  title: z.string().trim().min(8).max(140),
  body: z.string().trim().min(20).max(10000),
  topic: ForumTopic.default("general"),
  peptide: ForumSlug.nullish(),
  product: ForumSlug.nullish(),
  lot: ForumLot.nullish(),
  images: Images,
}).strict()

export const StoreCreateForumPostSchema = z.object({
  body: z.string().trim().min(2).max(5000),
  images: Images,
}).strict()

export const StoreAcceptForumAnswerSchema = z.object({
  post_id: ForumId.nullable(),
}).strict()

export const StoreEditForumPostSchema = StoreCreateForumPostSchema.omit({ images: true })

export const StoreReportForumPostSchema = z.object({
  reason: z.enum(["dose", "medical_claim", "spam", "abuse", "other"]),
  note: z.string().trim().max(500).nullish(),
}).strict()

export const StoreSaveForumProfileSchema = z.object({
  display_name: z.string().trim().min(3).max(32),
  bio: z.string().trim().max(500).nullish(),
  accept_guidelines: z.literal(true),
}).strict()

export const StoreForumLotCountsQuery = z.object({ lots: commaList(ForumLot, 200) }).strict()

export type StoreForumThreadsQueryType = z.infer<typeof StoreForumThreadsQuery>
export type StoreForumThreadQueryType = z.infer<typeof StoreForumThreadQuery>
export type StoreCreateForumThreadBody = z.infer<typeof StoreCreateForumThreadSchema>
export type StoreCreateForumPostBody = z.infer<typeof StoreCreateForumPostSchema>
export type StoreAcceptForumAnswerBody = z.infer<typeof StoreAcceptForumAnswerSchema>
export type StoreEditForumPostBody = z.infer<typeof StoreEditForumPostSchema>
export type StoreReportForumPostBody = z.infer<typeof StoreReportForumPostSchema>
export type StoreSaveForumProfileBody = z.infer<typeof StoreSaveForumProfileSchema>
export type StoreForumLotCountsQueryType = z.infer<typeof StoreForumLotCountsQuery>
