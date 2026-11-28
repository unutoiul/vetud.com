/**
 * Microsoft Clarity (heatmaps and session replays), Clarity project "Vetud Peptides".
 * NEXT_PUBLIC_CLARITY_ID overrides the project ID; it's public anyway (it's in every page).
 *
 * Runs on the live site only, never on localhost or Vercel previews. The shop has no cookie banner,
 * so visitors in the EEA, the UK and Switzerland are recorded without cookies. Typed text stays
 * masked (Clarity's default) and the checkout, account and order pages are masked in full
 * (data-clarity-mask on those pages). Nothing is shared for advertising.
 */
export const CLARITY_ID = (process.env.NEXT_PUBLIC_CLARITY_ID || "zjow4of5w5").trim()
export const CLARITY_HOSTS = ["www.vetudpeptides.com", "vetudpeptides.com"]

/** Where analytics cookies need a yes first: the EEA, the UK and Switzerland. */
const CONSENT_COUNTRIES = new Set([
  "at",
  "be",
  "bg",
  "hr",
  "cy",
  "cz",
  "dk",
  "ee",
  "fi",
  "fr",
  "de",
  "gr",
  "hu",
  "ie",
  "it",
  "lv",
  "lt",
  "lu",
  "mt",
  "nl",
  "pl",
  "pt",
  "ro",
  "sk",
  "si",
  "es",
  "se",
  "is",
  "li",
  "no",
  "gb",
  "ch",
])

function europeanTimeZone() {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ""
    return (
      /^Europe\//.test(zone) ||
      /^Atlantic\/(Reykjavik|Faroe|Canary|Madeira|Azores)$/.test(zone) ||
      /^Asia\/(Nicosia|Famagusta)$/.test(zone)
    )
  } catch {
    return false
  }
}

/** True when the shop country or the browser's time zone is in Europe: Clarity then sets no cookies. */
export function cookielessAnalytics(country?: string) {
  return (country ? CONSENT_COUNTRIES.has(country.toLowerCase()) : false) || europeanTimeZone()
}
