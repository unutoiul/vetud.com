import Medusa from "@medusajs/js-sdk"
import { MEDUSA_BACKEND_URL, MEDUSA_PUBLISHABLE_KEY } from "../config"

/**
 * One SDK instance for server components and the browser. The storefront only uses guest
 * flows, so no auth token is stored.
 */
export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  publishableKey: MEDUSA_PUBLISHABLE_KEY,
  debug: false,
  auth: { type: "jwt", jwtTokenStorageMethod: "nostore" },
})
