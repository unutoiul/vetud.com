/**
 * Microsoft Clarity (heatmaps and session replays), Clarity project "Vetud".
 * NEXT_PUBLIC_CLARITY_ID overrides the project ID; it's public anyway (it's in every page).
 *
 * Runs on the live site only, never on localhost or Vercel previews. The site has no cookie banner,
 * so visitors whose browser is set to a European time zone are recorded without cookies. Typed text
 * stays masked (Clarity's default) and the account page is masked in full (data-clarity-mask).
 * Nothing is shared for advertising.
 */
export const CLARITY_ID = (process.env.NEXT_PUBLIC_CLARITY_ID || "zjovqq4646").trim()
export const CLARITY_HOSTS = ["www.vetud.com", "vetud.com"]

/** The EEA, the UK and Switzerland, where analytics cookies need a yes first, all use European time zones. */
export function cookielessAnalytics() {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ""
    return (
      /^Europe\//.test(zone) ||
      /^Atlantic\/(Reykjavik|Faroe|Canary|Madeira|Azores)$/.test(zone) ||
      /^Asia\/(Nicosia|Famagusta)$/.test(zone)
    )
  } catch {
    return true
  }
}
