import { z } from "@medusajs/framework/zod"

/** Storefront article slugs, e.g. "retatrutide-phase-3-results". */
export const ArticleSlug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160)

export const COMMENT_MAX_LENGTH = 2000

export const StoreArticleCommentsQuery = z.object({
  article: ArticleSlug,
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(50).default(20),
}).strict()

export const StoreCreateArticleCommentSchema = z.object({
  article: ArticleSlug,
  body: z.string().trim().min(2).max(COMMENT_MAX_LENGTH),
}).strict()

export type StoreArticleCommentsQueryType = z.infer<typeof StoreArticleCommentsQuery>
export type StoreCreateArticleCommentBody = z.infer<typeof StoreCreateArticleCommentSchema>
