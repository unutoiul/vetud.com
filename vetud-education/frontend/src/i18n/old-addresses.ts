import { DEFAULT_LANGUAGE, isLanguage } from "./languages"

/**
 * vetud.com used to be one site with an address per country (/gb/learn, /de/shop). These rules keep
 * every old address working: learning pages move to their language, shop pages to the shop's domain.
 */
const OLD_COUNTRY_LANGUAGE: Record<string, string> = {
  us: "en", gb: "en", ca: "en", au: "en", ie: "en", mt: "en",
  de: "de", at: "de", ch: "de", li: "de", fr: "fr", lu: "fr", nl: "nl", be: "nl", gr: "el", cy: "el",
  it: "it", es: "es", pt: "pt", pl: "pl", cz: "cs", sk: "sk", hu: "hu", ro: "ro", bg: "bg", hr: "hr",
  si: "sl", se: "sv", dk: "da", no: "nb", fi: "fi", is: "is", ee: "et", lv: "lv", lt: "lt",
}

const LEARNING_SECTIONS = "learn|news|videos|community|contact|account|newsletter"
const SHOP_SECTIONS = "shop|products|cart|checkout|order|tracking|documentation|standards|dual-chamber-pen|discover"
const SHOP_LEGAL = "terms|shipping|shipping-returns|returns|refunds|chargebacks|research-use"

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

  if (shopUrl) {
    const everyCountry = `/:country(${Object.keys(OLD_COUNTRY_LANGUAGE).join("|")})`
    rules.push(
      { source: `${everyCountry}/:section(${SHOP_SECTIONS})/:path*`, destination: `${shopUrl}/:country/:section/:path*` },
      { source: `${everyCountry}/legal/:slug(${SHOP_LEGAL})`, destination: `${shopUrl}/:country/legal/:slug` },
      { source: `/:section(${SHOP_SECTIONS})/:path*`, destination: `${shopUrl}/:section/:path*` },
      // Old orders and emails still point at product images and videos on this address.
      { source: "/images/products/:path*", destination: `${shopUrl}/images/products/:path*` },
      { source: "/videos/:file(.+\\.(?:mp4|webp|jpg|png))", destination: `${shopUrl}/videos/:file` },
    )
  }
  return rules.map((rule) => ({ ...rule, permanent }))
}
