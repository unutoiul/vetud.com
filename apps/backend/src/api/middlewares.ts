import {
  authenticate,
  configureStoreSearch,
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { StoreContactSchema } from "./store/contact/validators"
import { CustomerOrdersQuery } from "./store/account/orders/validators"

export default defineMiddlewares({
  routes: [
    {
      method: ["GET"],
      matcher: "/store/account/orders",
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        validateAndTransformQuery(CustomerOrdersQuery, { isList: true, defaults: [] }),
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
  ],
})
