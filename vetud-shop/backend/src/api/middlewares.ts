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
import { StoreGuestOrderAccountSchema } from "./store/guest-orders/[id]/account/validators"
import { AdminCreateStorewideSale, AdminUpdateStorewideSale } from "./admin/storewide-sales/validators"
import { AdminSetFreeShipping } from "./admin/free-shipping/validators"
import { prepareNmiSession } from "./nmi-session"
import { nmiGuardRoutes } from "./nmi-guards"
import { cartOwnerGuardRoutes, requireCartOwner } from "./cart-owner-guards"
import * as cartQueryConfig from "@medusajs/medusa/api/store/carts/query-config"
import { StoreGetCartsCart } from "@medusajs/medusa/api/store/carts/validators"
import { StoreSetCartDeliveryAddressSchema } from "./store/carts/[id]/delivery-address/validators"
import { paygateGuardRoutes, preparePaygateSession } from "./paygate-guards"
import { paypalGuardRoutes, preparePayPalSession } from "./paypal-guards"
import { cartBillingRoutes } from "./cart-billing"
import { checkoutEmailGuardRoutes } from "./checkout-email-guard"
import { StoreSetCheckoutEmailSchema } from "./store/carts/[id]/contact/validators"
import { StoreSignInCodeSchema } from "./store/sign-in-code/validators"

export default defineMiddlewares({
  routes: [
    ...nmiGuardRoutes,
    ...cartOwnerGuardRoutes,
    ...checkoutEmailGuardRoutes,
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
        authenticate("customer", ["session", "bearer"], { allowUnauthenticated: true }),
        requireCartOwner,
        validateAndTransformBody(StoreSetCartDeliveryAddressSchema),
        validateAndTransformQuery(StoreGetCartsCart, cartQueryConfig.retrieveTransformQueryConfig),
      ],
    },
    {
      // The guest checkout's Contact step: any email works; a member's email files the order in that account.
      method: ["POST"],
      matcher: "/store/carts/:id/contact",
      middlewares: [
        authenticate("customer", ["session", "bearer"], { allowUnauthenticated: true }),
        requireCartOwner,
        validateAndTransformBody(StoreSetCheckoutEmailSchema),
        validateAndTransformQuery(StoreGetCartsCart, cartQueryConfig.retrieveTransformQueryConfig),
      ],
    },
    {
      // Customers sign in with an emailed code; this sends it (POST /auth/customer/email-code checks it).
      method: ["POST"],
      matcher: "/store/sign-in-code",
      middlewares: [validateAndTransformBody(StoreSignInCodeSchema)],
    },
    {
      // After a guest order: make the account (first code sign-in) or add the order to the member's.
      method: ["POST"],
      matcher: "/store/guest-orders/:id/account",
      middlewares: [
        authenticate("customer", ["session", "bearer"], { allowUnauthenticated: true, allowUnregistered: true }),
        validateAndTransformBody(StoreGuestOrderAccountSchema),
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
      matcher: "/admin/free-shipping",
      middlewares: [validateAndTransformBody(AdminSetFreeShipping)],
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
