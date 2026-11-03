import type { MiddlewareRoute } from "@medusajs/framework/http"
import { authenticate, validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework/http"
import {
  AdminForumMembersQuery,
  AdminForumQueueQuery,
  AdminForumThreadsQuery,
  AdminModerateForumPostSchema,
  AdminUpdateForumMemberSchema,
  AdminUpdateForumThreadSchema,
} from "./admin/forum/validators"
import {
  StoreAcceptForumAnswerSchema,
  StoreCreateForumPostSchema,
  StoreCreateForumThreadSchema,
  StoreEditForumPostSchema,
  StoreForumCheckInSchema,
  StoreForumInsightsQuery,
  StoreForumLotCountsQuery,
  StoreForumThreadQuery,
  StoreForumThreadsQuery,
  StoreReportForumPostSchema,
  StoreSaveForumProfileSchema,
} from "./store/forum/validators"

// Anyone can read the community; a signed-in reader's own posts and votes are flagged.
const optionalCustomer = authenticate("customer", ["session", "bearer"], { allowUnauthenticated: true })
const customer = authenticate("customer", ["session", "bearer"])
const listQuery = <T extends Parameters<typeof validateAndTransformQuery>[0]>(schema: T) =>
  validateAndTransformQuery(schema, { isList: true, defaults: [] })

// Spread into defineMiddlewares({ routes: [...] }). Admin routes need an admin session by default.
export const forumRoutes: MiddlewareRoute[] = [
  { method: ["GET"], matcher: "/store/forum/threads", middlewares: [optionalCustomer, listQuery(StoreForumThreadsQuery)] },
  { method: ["POST"], matcher: "/store/forum/threads", middlewares: [customer, validateAndTransformBody(StoreCreateForumThreadSchema)] },
  { method: ["GET"], matcher: "/store/forum/threads/:id", middlewares: [optionalCustomer, listQuery(StoreForumThreadQuery)] },
  { method: ["POST"], matcher: "/store/forum/threads/:id/posts", middlewares: [customer, validateAndTransformBody(StoreCreateForumPostSchema)] },
  { method: ["POST"], matcher: "/store/forum/threads/:id/check-ins", middlewares: [customer, validateAndTransformBody(StoreForumCheckInSchema)] },
  { method: ["POST"], matcher: "/store/forum/threads/:id/accept", middlewares: [customer, validateAndTransformBody(StoreAcceptForumAnswerSchema)] },
  { method: ["POST"], matcher: "/store/forum/posts/:id", middlewares: [customer, validateAndTransformBody(StoreEditForumPostSchema)] },
  { method: ["DELETE"], matcher: "/store/forum/posts/:id", middlewares: [customer] },
  { method: ["POST", "DELETE"], matcher: "/store/forum/posts/:id/helpful", middlewares: [customer] },
  { method: ["POST"], matcher: "/store/forum/posts/:id/report", middlewares: [customer, validateAndTransformBody(StoreReportForumPostSchema)] },
  { method: ["GET"], matcher: "/store/forum/me", middlewares: [customer] },
  { method: ["POST"], matcher: "/store/forum/me", middlewares: [customer, validateAndTransformBody(StoreSaveForumProfileSchema)] },
  { method: ["GET"], matcher: "/store/forum/members/:handle", middlewares: [optionalCustomer] },
  { method: ["GET"], matcher: "/store/forum/insights", middlewares: [validateAndTransformQuery(StoreForumInsightsQuery, { isList: false, defaults: [] })] },
  { method: ["GET"], matcher: "/store/forum/lot-counts", middlewares: [validateAndTransformQuery(StoreForumLotCountsQuery, { isList: false, defaults: [] })] },

  { method: ["GET"], matcher: "/admin/forum/queue", middlewares: [listQuery(AdminForumQueueQuery)] },
  { method: ["POST"], matcher: "/admin/forum/posts/:id/moderate", middlewares: [validateAndTransformBody(AdminModerateForumPostSchema)] },
  { method: ["GET"], matcher: "/admin/forum/threads", middlewares: [listQuery(AdminForumThreadsQuery)] },
  { method: ["POST"], matcher: "/admin/forum/threads/:id", middlewares: [validateAndTransformBody(AdminUpdateForumThreadSchema)] },
  { method: ["GET"], matcher: "/admin/forum/members", middlewares: [listQuery(AdminForumMembersQuery)] },
  { method: ["POST"], matcher: "/admin/forum/members/:id", middlewares: [validateAndTransformBody(AdminUpdateForumMemberSchema)] },
]
