import { z } from "@medusajs/framework/zod"

/** Storefront library slugs ("bpc-157") and product handles share this shape. */
export const ForumSlug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80)
/** As printed on packaging, e.g. "VTD01-2609A". */
export const ForumLot = z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9][A-Za-z0-9 _./-]*$/)
const ForumId = z.string().trim().min(1).max(64)

const commaList = (item: z.ZodString, max: number) =>
  z.string().trim().max(2000)
    .transform(value => value.split(",").map(entry => entry.trim()).filter(Boolean))
    .pipe(z.array(item).max(max))

const ThreadKind = z.enum(["discussion", "question", "research_log"])
const Offset = z.coerce.number().int().min(0).default(0)

export const StoreForumThreadsQuery = z.object({
  kind: ThreadKind.optional(),
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

const Measurement = z.object({
  metric: z.string().trim().max(40),
  week: z.number().int().min(0).max(104),
  value: z.number().finite(),
}).strict()

export const StoreCreateForumThreadSchema = z.object({
  kind: ThreadKind,
  title: z.string().trim().min(8).max(140),
  body: z.string().trim().min(20).max(10000),
  peptide: ForumSlug.nullish(),
  other_peptides: z.array(ForumSlug).max(5).optional(),
  product: ForumSlug.nullish(),
  lot: ForumLot.nullish(),
  unit_system: z.enum(["metric", "imperial"]).optional(),
  side_effects: z.array(z.string().trim().min(2).max(60)).max(12).optional(),
  measurements: z.array(Measurement).max(40).optional(),
  // Research logs publish health measurements, so the member agrees to that explicitly.
  consent: z.boolean().optional(),
}).strict().refine(body => body.kind !== "research_log" || body.consent === true, {
  message: "Please confirm that your log, including its measurements, can be published.",
  path: ["consent"],
})

export const StoreCreateForumPostSchema = z.object({
  body: z.string().trim().min(2).max(5000),
}).strict()

export const StoreForumCheckInSchema = z.object({
  week: z.number().int().min(1).max(104),
  body: z.string().trim().max(5000).nullish(),
  measurements: z.array(z.object({ metric: z.string().trim().max(40), value: z.number().finite() }).strict()).max(20),
}).strict()

export const StoreAcceptForumAnswerSchema = z.object({
  post_id: ForumId.nullable(),
}).strict()

export const StoreEditForumPostSchema = StoreCreateForumPostSchema

export const StoreReportForumPostSchema = z.object({
  reason: z.enum(["dose", "medical_claim", "spam", "abuse", "other"]),
  note: z.string().trim().max(500).nullish(),
}).strict()

export const StoreSaveForumProfileSchema = z.object({
  display_name: z.string().trim().min(3).max(32),
  bio: z.string().trim().max(500).nullish(),
  accept_guidelines: z.literal(true),
}).strict()

export const StoreForumInsightsQuery = z.object({ peptide: ForumSlug }).strict()

export const StoreForumLotCountsQuery = z.object({ lots: commaList(ForumLot, 200) }).strict()

export type StoreForumThreadsQueryType = z.infer<typeof StoreForumThreadsQuery>
export type StoreForumThreadQueryType = z.infer<typeof StoreForumThreadQuery>
export type StoreCreateForumThreadBody = z.infer<typeof StoreCreateForumThreadSchema>
export type StoreCreateForumPostBody = z.infer<typeof StoreCreateForumPostSchema>
export type StoreForumCheckInBody = z.infer<typeof StoreForumCheckInSchema>
export type StoreAcceptForumAnswerBody = z.infer<typeof StoreAcceptForumAnswerSchema>
export type StoreEditForumPostBody = z.infer<typeof StoreEditForumPostSchema>
export type StoreReportForumPostBody = z.infer<typeof StoreReportForumPostSchema>
export type StoreSaveForumProfileBody = z.infer<typeof StoreSaveForumProfileSchema>
export type StoreForumInsightsQueryType = z.infer<typeof StoreForumInsightsQuery>
export type StoreForumLotCountsQueryType = z.infer<typeof StoreForumLotCountsQuery>
