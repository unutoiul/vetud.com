import { CURRENCY_COOKIE, type StoreCurrency } from "./store-segment"

const remember = (name: string, value: string) => {
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=31536000; Path=/; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`
}

/** Remembers the visitor's country for a year, so the next visit lands on the same country. */
export function persistCountryCookie(code: string) {
  remember("vetud_country", code)
}

/** Forgets the chosen currency: each country shows its own again. */
export function clearCurrencyCookie() {
  document.cookie = `${CURRENCY_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`
}

/** Remembers the currency the visitor chose, whatever the country (read by the proxy). */
export function persistCurrencyCookie(currency: StoreCurrency) {
  remember(CURRENCY_COOKIE, currency)
}
