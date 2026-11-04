import countryRules from "./countries.json"

export type StoreCountry = keyof typeof countryRules
export const COUNTRY_RULES = countryRules
export function getCountryRules(code: string) {
  return countryRules[code.toLowerCase() as StoreCountry] ?? countryRules.us
}

/** One message file per language; regional locales (de-AT, en-CA) use their language's file. */
const messages = {
  "en-US": () => import("./messages/en-US.json"),
  "en-GB": () => import("./messages/en-GB.json"),
  de: () => import("./messages/de.json"),
  fr: () => import("./messages/fr.json"),
  nl: () => import("./messages/nl.json"),
  it: () => import("./messages/it.json"),
  es: () => import("./messages/es.json"),
  pt: () => import("./messages/pt.json"),
  pl: () => import("./messages/pl.json"),
  cs: () => import("./messages/cs.json"),
  sk: () => import("./messages/sk.json"),
  hu: () => import("./messages/hu.json"),
  ro: () => import("./messages/ro.json"),
  bg: () => import("./messages/bg.json"),
  hr: () => import("./messages/hr.json"),
  sl: () => import("./messages/sl.json"),
  el: () => import("./messages/el.json"),
  sv: () => import("./messages/sv.json"),
  da: () => import("./messages/da.json"),
  nb: () => import("./messages/nb.json"),
  fi: () => import("./messages/fi.json"),
  et: () => import("./messages/et.json"),
  lv: () => import("./messages/lv.json"),
  lt: () => import("./messages/lt.json"),
  is: () => import("./messages/is.json"),
}

type MessageLocale = keyof typeof messages

/** "de-AT" → de, "en-CA" → en-GB (British spelling outside the US), "fr" → fr. */
function messageLocale(locale: string): MessageLocale {
  if (Object.hasOwn(messages, locale)) return locale as MessageLocale
  const language = locale.split("-")[0]
  if (language === "en") return "en-GB"
  return Object.hasOwn(messages, language) ? (language as MessageLocale) : "en-US"
}

/** The country's locale (for dates, numbers and <html lang>) and its language's messages. */
export async function getCountryI18n(country: string) {
  const locale = getCountryRules(country).locale
  return { locale, messages: (await messages[messageLocale(locale)]()).default, timeZone: "UTC" }
}
