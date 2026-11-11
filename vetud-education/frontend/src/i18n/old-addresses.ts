import { DEFAULT_LANGUAGE, isLanguage } from "./languages"

/**
 * vetud.com used to be one site with an address per country (/gb/learn, /de/shop). These rules move
 * old learning addresses to their language. Old shop pages are not redirected: this site has no link
 * to the shop. Only the addresses in old shop emails and payment returns still forward (see below).
 */
const OLD_COUNTRY_LANGUAGE: Record<string, string> = {
  us: "en", gb: "en", ca: "en", au: "en", ie: "en", mt: "en",
  de: "de", at: "de", ch: "de", li: "de", fr: "fr", lu: "fr", nl: "nl", be: "nl", gr: "el", cy: "el",
  it: "it", es: "es", pt: "pt", pl: "pl", cz: "cs", sk: "sk", hu: "hu", ro: "ro", bg: "bg", hr: "hr",
  si: "sl", se: "sv", dk: "da", no: "nb", fi: "fi", is: "is", ee: "et", lv: "lv", lt: "lt",
}

const LEARNING_SECTIONS = "learn|news|videos|community|contact|account|newsletter"
/** Pages that shop emails and payment providers still send people to, until the shop's emails use its own address. */
const SHOP_EMAIL_SECTIONS = "order|tracking|shop"

type Redirect = { source: string; destination: string; permanent: boolean }

export function oldAddressRedirects({ shopUrl, permanent }: { shopUrl: string; permanent: boolean }): Redirect[] {
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

  // Temporary: order emails, payment returns and product images sent before 2026-11-11 still use this
  // address. Remove NEXT_PUBLIC_SHOP_URL from this project once the shop backend's STOREFRONT_URL and
  // product image addresses use the shop's own domain, and these last forwards stop.
  if (shopUrl) {
    const everyCountry = `/:country(${Object.keys(OLD_COUNTRY_LANGUAGE).join("|")})`
    rules.push(
      { source: `${everyCountry}/:section(${SHOP_EMAIL_SECTIONS})/:path*`, destination: `${shopUrl}/:country/:section/:path*` },
      { source: `/:section(${SHOP_EMAIL_SECTIONS})/:path*`, destination: `${shopUrl}/:section/:path*` },
      { source: "/images/products/:path*", destination: `${shopUrl}/images/products/:path*` },
      { source: "/videos/:file(.+\\.(?:mp4|webp|jpg|png))", destination: `${shopUrl}/videos/:file` },
    )
  }
  return rules.map((rule) => ({ ...rule, permanent }))
}
