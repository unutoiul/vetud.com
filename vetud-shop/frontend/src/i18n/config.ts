import { getCountryCallingCode, type CountryCode } from "libphonenumber-js"
import countryRules from "./countries.json"

export type StoreCountry = keyof typeof countryRules
export const COUNTRY_RULES = countryRules

/** `postalOptional` / `provinceOptional`: the postcode and state fields aren't required (rest of the world). */
export type CountryRules = (typeof countryRules)["us"] & { postalOptional?: boolean; provinceOptional?: boolean }

/**
 * Countries we deliver to without a set-up address format (since 2026-11-06 the rest of the world):
 * lenient rules, the postcode and state optional (many countries have neither), the phone code from
 * libphonenumber.
 */
function worldRules(code: string): CountryRules {
  let callingCode = ""
  try {
    callingCode = getCountryCallingCode(code.toUpperCase() as CountryCode)
  } catch {
    // Territories without a calling code of their own: the phone field just starts empty.
  }
  return {
    locale: "en-US", callingCode, postalLabel: "postal", cityLabel: "city", postalPattern: "^[A-Z0-9][A-Z0-9 -]{1,11}$", postalExample: "",
    postalBeforeCity: false, numberAfterStreet: false, provinceRequired: false, postalOptional: true, provinceOptional: true,
  }
}

export function getCountryRules(code: string): CountryRules {
  const known = countryRules[code.toLowerCase() as StoreCountry]
  if (known) return known
  return /^[a-z]{2}$/i.test(code) ? worldRules(code) : countryRules.us
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
export function messageLocale(locale: string): MessageLocale {
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
