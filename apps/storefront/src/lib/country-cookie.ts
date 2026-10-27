/** Remembers the visitor's country for a year, so the next visit lands on the same country and currency. */
export function persistCountryCookie(code: string) {
  document.cookie = `vetud_country=${encodeURIComponent(code)}; Max-Age=31536000; Path=/; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`
}
