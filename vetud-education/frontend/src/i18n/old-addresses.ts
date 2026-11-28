import { DEFAULT_LANGUAGE, isLanguage } from "./languages"

/**
 * vetud.com used to be one site with an address per country (/gb/learn, /de/shop). These rules move
 * old learning addresses to their language. Old shop addresses are not forwarded anywhere: this site
 * has no link to any shop (owner, 2026-11-27; Meta treats a forward to a peptide shop as selling).
 */
const OLD_COUNTRY_LANGUAGE: Record<string, string> = {
  us: "en",
  gb: "en",
  ca: "en",
  au: "en",
  ie: "en",
  mt: "en",
  de: "de",
  at: "de",
  ch: "de",
  li: "de",
  fr: "fr",
  lu: "fr",
  nl: "nl",
  be: "nl",
  gr: "el",
  cy: "el",
  it: "it",
  es: "es",
  pt: "pt",
  pl: "pl",
  cz: "cs",
  sk: "sk",
  hu: "hu",
  ro: "ro",
  bg: "bg",
  hr: "hr",
  si: "sl",
  se: "sv",
  dk: "da",
  no: "nb",
  fi: "fi",
  is: "is",
  ee: "et",
  lv: "lv",
  lt: "lt",
}

const LEARNING_SECTIONS = "learn|news|videos|community|contact|account|newsletter"

type Redirect = { source: string; destination: string; permanent: boolean }

export function oldAddressRedirects({ permanent }: { permanent: boolean }): Redirect[] {
  const byLanguage = new Map<string, string[]>()
  for (const [country, language] of Object.entries(OLD_COUNTRY_LANGUAGE)) {
    const target = isLanguage(language) ? language : DEFAULT_LANGUAGE
    if (country !== target) byLanguage.set(target, [...(byLanguage.get(target) ?? []), country])
  }

  const rules: Omit<Redirect, "permanent">[] = [...byLanguage].flatMap(([language, countries]) => {
    const country = `/:country(${countries.join("|")})`
    return [
      { source: country, destination: `/${language}` },
      { source: `${country}/education`, destination: `/${language}/learn` },
      { source: `${country}/:section(${LEARNING_SECTIONS})/:path*`, destination: `/${language}/:section/:path*` },
      { source: `${country}/legal/privacy`, destination: `/${language}/legal/privacy` },
    ]
  })
  rules.push({ source: "/education", destination: `/${DEFAULT_LANGUAGE}/learn` })

  return rules.map((rule) => ({ ...rule, permanent }))
}
