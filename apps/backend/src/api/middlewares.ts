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
import { prepareNmiSession } from "./nmi-session"
import { nmiGuardRoutes } from "./nmi-guards"
import { cartOwnerGuardRoutes } from "./cart-owner-guards"
import { paygateGuardRoutes, preparePaygateSession } from "./paygate-guards"

export default defineMiddlewares({
  routes: [
    ...nmiGuardRoutes,
    ...cartOwnerGuardRoutes,
    ...paygateGuardRoutes,
    {
      method: ["POST"],
      matcher: "/store/payment-collections/:id/payment-sessions",
      middlewares: [
        authenticate("customer", ["session", "bearer"], { allowUnauthenticated: true }),
        prepareNmiSession,
        preparePaygateSession,
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
  ],
})
