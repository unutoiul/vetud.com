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
import { StoreSignInCodeSchema } from "./store/sign-in-code/validators"
import { StoreBookCheckoutSchema, StoreBookOrderQuery } from "./store/book/validators"

export default defineMiddlewares({
  routes: [
    ...forumRoutes,
    ...accountRoutes,
    {
      // Members sign in with an emailed code; this sends it (POST /auth/customer/email-code checks it).
      method: ["POST"],
      matcher: "/store/sign-in-code",
      middlewares: [validateAndTransformBody(StoreSignInCodeSchema)],
    },
    {
      method: ["POST"],
      matcher: "/store/contact",
      middlewares: [validateAndTransformBody(StoreContactSchema)],
    },
    {
      // Stripe's webhook for the book checks its signature against the exact bytes Stripe sent.
      method: ["POST"],
      matcher: "/hooks/stripe-book",
      bodyParser: { preserveRawBody: true },
    },
    {
      // The $4.99 PDF book: start a Stripe Checkout, then check the payment on the way back.
      method: ["POST"],
      matcher: "/store/book/checkout",
      middlewares: [validateAndTransformBody(StoreBookCheckoutSchema)],
    },
    {
      method: ["GET"],
      matcher: "/store/book/order",
      middlewares: [validateAndTransformQuery(StoreBookOrderQuery, {})],
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
