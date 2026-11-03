import { z } from "@medusajs/framework/zod"

const Offset = z.coerce.number().int().min(0).default(0)
const Limit = z.coerce.number().int().min(1).max(100).default(50)

export const AdminForumQueueQuery = z.object({ offset: Offset, limit: Limit }).strict()

export const AdminForumThreadsQuery = z.object({
  q: z.string().trim().max(80).optional(),
  status: z.enum(["published", "pending", "hidden", "removed"]).optional(),
  kind: z.enum(["discussion", "question", "research_log"]).optional(),
  offset: Offset,
  limit: Limit,
}).strict()

export const AdminForumMembersQuery = z.object({
  q: z.string().trim().max(80).optional(),
  role: z.enum(["member", "expert", "moderator"]).optional(),
  offset: Offset,
  limit: Limit,
}).strict()

export const AdminModerateForumPostSchema = z.object({
  action: z.enum(["approve", "hide", "remove"]),
}).strict()

export const AdminUpdateForumThreadSchema = z.object({
  pinned: z.boolean().optional(),
  locked: z.boolean().optional(),
  exclude_from_insights: z.boolean().optional(),
}).strict()

export const AdminUpdateForumMemberSchema = z.object({
  role: z.enum(["member", "expert", "moderator"]).optional(),
  credentials: z.string().trim().max(80).nullish(),
  status: z.enum(["active", "muted", "banned"]).optional(),
}).strict()

export type AdminForumQueueQueryType = z.infer<typeof AdminForumQueueQuery>
export type AdminForumThreadsQueryType = z.infer<typeof AdminForumThreadsQuery>
export type AdminForumMembersQueryType = z.infer<typeof AdminForumMembersQuery>
export type AdminModerateForumPostBody = z.infer<typeof AdminModerateForumPostSchema>
export type AdminUpdateForumThreadBody = z.infer<typeof AdminUpdateForumThreadSchema>
export type AdminUpdateForumMemberBody = z.infer<typeof AdminUpdateForumMemberSchema>
