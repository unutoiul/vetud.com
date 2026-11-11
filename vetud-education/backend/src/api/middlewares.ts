import {
  authenticate,
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { StoreContactSchema } from "./store/contact/validators"
import { StoreArticleCommentsQuery, StoreCreateArticleCommentSchema } from "./store/article-comments/validators"
import { AdminArticleCommentsQuery } from "./admin/article-comments/validators"
import {
  StoreConfirmEmailListSchema,
  StoreEmailListSchema,
  StoreUnsubscribeEmailListSchema,
} from "./store/email-list/validators"
import { accountRoutes } from "./account-middlewares"
import { forumRoutes } from "./forum-middlewares"
import { signInCodeRoutes } from "./sign-in-code-middlewares"

export default defineMiddlewares({
  routes: [
    ...forumRoutes,
    ...accountRoutes,
    ...signInCodeRoutes,
    {
      method: ["POST"],
      matcher: "/store/contact",
      middlewares: [validateAndTransformBody(StoreContactSchema)],
    },
    {
      method: ["POST"],
      matcher: "/store/email-list",
      middlewares: [validateAndTransformBody(StoreEmailListSchema)],
    },
    {
      method: ["POST"],
      matcher: "/store/email-list/confirm",
      middlewares: [validateAndTransformBody(StoreConfirmEmailListSchema)],
    },
    {
      method: ["POST"],
      matcher: "/store/email-list/unsubscribe",
      middlewares: [validateAndTransformBody(StoreUnsubscribeEmailListSchema)],
    },
    {
      // Anyone can read comments; a signed-in reader's own comments are flagged in the response.
      method: ["GET"],
      matcher: "/store/article-comments",
      middlewares: [
        authenticate("customer", ["session", "bearer"], { allowUnauthenticated: true }),
        validateAndTransformQuery(StoreArticleCommentsQuery, { isList: true, defaults: [] }),
      ],
    },
    {
      method: ["POST"],
      matcher: "/store/article-comments",
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        validateAndTransformBody(StoreCreateArticleCommentSchema),
      ],
    },
    {
      method: ["DELETE"],
      matcher: "/store/article-comments/:id",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      method: ["GET"],
      matcher: "/admin/article-comments",
      middlewares: [validateAndTransformQuery(AdminArticleCommentsQuery, { isList: true, defaults: [] })],
    },
  ],
})
