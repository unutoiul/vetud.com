import countryRules from "./countries.json"

export type StoreCountry = keyof typeof countryRules
export const COUNTRY_RULES = countryRules
export function getCountryRules(code: string) {
  return countryRules[code.toLowerCase() as StoreCountry] ?? countryRules.us
}

const messages = {
  "en-US": () => import("./messages/en-US.json"),
  "en-GB": () => import("./messages/en-GB.json"),
  de: () => import("./messages/de.json"),
  fr: () => import("./messages/fr.json"),
  nl: () => import("./messages/nl.json"),
}

export async function getCountryI18n(country: string) {
  const locale = getCountryRules(country).locale as keyof typeof messages
  return { locale, messages: (await messages[locale]()).default, timeZone: "UTC" }
}
