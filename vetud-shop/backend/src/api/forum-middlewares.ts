import type { MedusaNextFunction, MedusaRequest, MedusaResponse, MiddlewareRoute } from "@medusajs/framework/http"
import { authenticate, validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import multer from "multer"
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

// Photos are kept in memory only until they're re-encoded and stored (see workflows/forum/images.ts).
const PHOTO_LIMIT_MB = 10
const photos = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: PHOTO_LIMIT_MB * 1024 * 1024, files: 4 },
  fileFilter: (_req, file, done) => /^image\/(jpeg|png|webp)$/.test(file.mimetype)
    ? done(null, true)
    : done(new MedusaError(MedusaError.Types.INVALID_DATA, "Photos must be JPEG, PNG or WebP.")),
}).array("files", 4)

function photoUpload(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  photos(req as never, res as never, (error?: unknown) => {
    if (!error || error instanceof MedusaError) return next(error)
    const code = error instanceof multer.MulterError ? error.code : null
    next(new MedusaError(MedusaError.Types.INVALID_DATA, code === "LIMIT_FILE_SIZE"
      ? `Each photo can be up to ${PHOTO_LIMIT_MB} MB.`
      : code === "LIMIT_FILE_COUNT" || code === "LIMIT_UNEXPECTED_FILE" ? "You can add up to 4 photos at a time." : "We couldn't read your photos. Please try again."))
  })
}

// Spread into defineMiddlewares({ routes: [...] }). Admin routes need an admin session by default.
export const forumRoutes: MiddlewareRoute[] = [
  { method: ["GET"], matcher: "/store/forum/threads", middlewares: [optionalCustomer, listQuery(StoreForumThreadsQuery)] },
  { method: ["POST"], matcher: "/store/forum/threads", middlewares: [customer, validateAndTransformBody(StoreCreateForumThreadSchema)] },
  { method: ["GET"], matcher: "/store/forum/threads/:id", middlewares: [optionalCustomer, listQuery(StoreForumThreadQuery)] },
  { method: ["POST"], matcher: "/store/forum/threads/:id/posts", middlewares: [customer, validateAndTransformBody(StoreCreateForumPostSchema)] },
  { method: ["POST"], matcher: "/store/forum/threads/:id/accept", middlewares: [customer, validateAndTransformBody(StoreAcceptForumAnswerSchema)] },
  { method: ["POST"], matcher: "/store/forum/posts/:id", middlewares: [customer, validateAndTransformBody(StoreEditForumPostSchema)] },
  { method: ["DELETE"], matcher: "/store/forum/posts/:id", middlewares: [customer] },
  { method: ["POST", "DELETE"], matcher: "/store/forum/posts/:id/helpful", middlewares: [customer] },
  { method: ["POST"], matcher: "/store/forum/posts/:id/report", middlewares: [customer, validateAndTransformBody(StoreReportForumPostSchema)] },
  { method: ["POST"], matcher: "/store/forum/uploads", bodyParser: false, middlewares: [customer, photoUpload] },
  { method: ["GET"], matcher: "/store/forum/me", middlewares: [customer] },
  { method: ["POST"], matcher: "/store/forum/me", middlewares: [customer, validateAndTransformBody(StoreSaveForumProfileSchema)] },
  { method: ["GET"], matcher: "/store/forum/members/:handle", middlewares: [optionalCustomer] },
  { method: ["GET"], matcher: "/store/forum/lot-counts", middlewares: [validateAndTransformQuery(StoreForumLotCountsQuery, { isList: false, defaults: [] })] },

  { method: ["GET"], matcher: "/admin/forum/queue", middlewares: [listQuery(AdminForumQueueQuery)] },
  { method: ["POST"], matcher: "/admin/forum/posts/:id/moderate", middlewares: [validateAndTransformBody(AdminModerateForumPostSchema)] },
  { method: ["GET"], matcher: "/admin/forum/threads", middlewares: [listQuery(AdminForumThreadsQuery)] },
  { method: ["POST"], matcher: "/admin/forum/threads/:id", middlewares: [validateAndTransformBody(AdminUpdateForumThreadSchema)] },
  { method: ["GET"], matcher: "/admin/forum/members", middlewares: [listQuery(AdminForumMembersQuery)] },
  { method: ["POST"], matcher: "/admin/forum/members/:id", middlewares: [validateAndTransformBody(AdminUpdateForumMemberSchema)] },
]
