import Medusa from "@medusajs/js-sdk"
import { MEDUSA_BACKEND_URL, MEDUSA_PUBLISHABLE_KEY } from "../config"

export const CUSTOMER_TOKEN_KEY = "vetud_customer_token"

/**
 * One SDK instance for server components and the browser. Customer JWTs are kept
 * in localStorage so returning shoppers can reuse their
 * profile, saved addresses and order history across visits.
 */
export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  publishableKey: MEDUSA_PUBLISHABLE_KEY,
  debug: false,
  // The shared SDK is also imported by Server Components for catalog data. LocalStorage is
  // deliberately browser-only; the server bundle must remain a stateless public client.
  auth: {
    type: "jwt",
    jwtTokenStorageMethod: typeof window === "undefined" ? "nostore" : "local",
    jwtTokenStorageKey: CUSTOMER_TOKEN_KEY,
  },
})
