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
import { AdminCreateStorewideSale, AdminUpdateStorewideSale } from "./admin/storewide-sales/validators"
import { prepareNmiSession } from "./nmi-session"
import { nmiGuardRoutes } from "./nmi-guards"
import { cartOwnerGuardRoutes, requireCartOwner } from "./cart-owner-guards"
import * as cartQueryConfig from "@medusajs/medusa/api/store/carts/query-config"
import { StoreGetCartsCart } from "@medusajs/medusa/api/store/carts/validators"
import { StoreSetCartDeliveryAddressSchema } from "./store/carts/[id]/delivery-address/validators"
import { paygateGuardRoutes, preparePaygateSession } from "./paygate-guards"
import { paypalGuardRoutes, preparePayPalSession } from "./paypal-guards"
import { cartBillingRoutes } from "./cart-billing"

export default defineMiddlewares({
  routes: [
    ...nmiGuardRoutes,
    ...cartOwnerGuardRoutes,
    ...paygateGuardRoutes,
    ...paypalGuardRoutes,
    ...cartBillingRoutes,
    {
      method: ["POST"],
      matcher: "/store/payment-collections/:id/payment-sessions",
      middlewares: [
        authenticate("customer", ["session", "bearer"], { allowUnauthenticated: true }),
        prepareNmiSession,
        preparePaygateSession,
        preparePayPalSession,
      ],
    },
    {
      // The delivery address for any country we sell to; the cart keeps the shopper's currency.
      method: ["POST"],
      matcher: "/store/carts/:id/delivery-address",
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        requireCartOwner,
        validateAndTransformBody(StoreSetCartDeliveryAddressSchema),
        validateAndTransformQuery(StoreGetCartsCart, cartQueryConfig.retrieveTransformQueryConfig),
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
