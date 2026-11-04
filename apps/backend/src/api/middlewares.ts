import {
  authenticate,
  configureStoreSearch,
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { StoreContactSchema } from "./store/contact/validators"
import { StoreNewsletterSchema, StoreNewsletterUnsubscribeSchema } from "./store/newsletter/validators"
import { CustomerOrderQuery, CustomerOrdersQuery } from "./store/account/orders/validators"
import { StoreArticleCommentsQuery, StoreCreateArticleCommentSchema } from "./store/article-comments/validators"
import { AdminArticleCommentsQuery } from "./admin/article-comments/validators"
import { AdminCreateStorewideSale, AdminUpdateStorewideSale } from "./admin/storewide-sales/validators"
import { prepareNmiSession } from "./nmi-session"
import { nmiGuardRoutes } from "./nmi-guards"
import { cartOwnerGuardRoutes } from "./cart-owner-guards"
import { forumRoutes } from "./forum-middlewares"
import { paygateGuardRoutes, preparePaygateSession } from "./paygate-guards"
import { prepareStripeSession } from "./stripe-session"

export default defineMiddlewares({
  routes: [
    ...nmiGuardRoutes,
    ...cartOwnerGuardRoutes,
    ...forumRoutes,
    ...paygateGuardRoutes,
    {
      method: ["POST"],
      matcher: "/store/payment-collections/:id/payment-sessions",
      middlewares: [
        authenticate("customer", ["session", "bearer"], { allowUnauthenticated: true }),
        prepareNmiSession,
        preparePaygateSession,
        prepareStripeSession,
      ],
    },
    {
      method: ["GET"],
      matcher: "/store/account/orders",
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        validateAndTransformQuery(CustomerOrdersQuery, { isList: true, defaults: [] }),
      ],
    },
    {
      method: ["GET"],
      matcher: "/store/account/orders/:id",
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        validateAndTransformQuery(CustomerOrderQuery, { isList: false, defaults: [] }),
      ],
    },
    {
      // Medusa narrows the product index to published products in the key's sales channels.
      method: ["POST"],
      matcher: "/store/search",
      middlewares: [
        configureStoreSearch({
          allowed_indexes: {
            products: true,
          },
        }),
      ],
    },
    {
      method: ["POST"],
      matcher: "/store/contact",
      middlewares: [validateAndTransformBody(StoreContactSchema)],
    },
    {
      method: ["POST"],
      matcher: "/store/newsletter",
      middlewares: [validateAndTransformBody(StoreNewsletterSchema)],
    },
    {
      method: ["POST"],
      matcher: "/store/newsletter/unsubscribe",
      middlewares: [validateAndTransformBody(StoreNewsletterUnsubscribeSchema)],
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
    {
      method: ["POST"],
      matcher: "/admin/storewide-sales",
      middlewares: [validateAndTransformBody(AdminCreateStorewideSale)],
    },
    {
      method: ["POST"],
      matcher: "/admin/storewide-sales/:id",
      middlewares: [validateAndTransformBody(AdminUpdateStorewideSale)],
    },
  ],
})
