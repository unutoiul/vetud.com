import { z } from "@medusajs/framework/zod"
import { ArticleSlug } from "../../store/article-comments/validators"

export const AdminArticleCommentsQuery = z.object({
  article: ArticleSlug.optional(),
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(50),
}).strict()

export type AdminArticleCommentsQueryType = z.infer<typeof AdminArticleCommentsQuery>
