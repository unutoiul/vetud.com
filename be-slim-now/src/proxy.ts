import { NextResponse, type NextRequest } from "next/server"
import { COUNTRY_COOKIE, DEFAULT_COUNTRY, isMarket, type CountryCode } from "@/config/markets"

/** A bare language most likely means this country (Accept-Language "sv" → Sweden). */
const LANGUAGE_COUNTRY: Record<string, CountryCode> = {
  en: "US",
  de: "DE",
  fr: "FR",
  nl: "NL",
  es: "ES",
  it: "IT",
  pt: "PT",
  pl: "PL",
  cs: "CZ",
  sk: "SK",
  hu: "HU",
  ro: "RO",
  bg: "BG",
  hr: "HR",
  sl: "SI",
  el: "GR",
  sv: "SE",
  da: "DK",
  nb: "NO",
  nn: "NO",
  no: "NO",
  fi: "FI",
  et: "EE",
  lv: "LV",
  lt: "LT",
  is: "IS",
  mt: "MT",
  ga: "IE",
  uk: "UA",
  sr: "RS",
  sq: "AL",
  mk: "MK",
  bs: "BA",
  be: "BY",
}

/** Only used when the host doesn't say where the visit comes from (local development). */
function languageCountry(request: NextRequest): CountryCode | null {
  const languages = (request.headers.get("accept-language") ?? "")
    .split(",")
    .map((part) => part.split(";")[0]?.trim())
    .filter(Boolean)
  for (const language of languages) {
    const [base, region] = language.split("-")
    if (region) return isMarket(region.toUpperCase()) ? (region.toUpperCase() as CountryCode) : null
    const country = LANGUAGE_COUNTRY[base.toLowerCase()]
    if (country) return country
  }
  return null
}

/**
 * Whose prices to show: the country the visitor chose in the header (cookie), else the country the
 * visit comes from (Vercel's x-vercel-ip-country), else US prices. Countries outside the picker get
 * US prices too.
 */
function visitorCountry(request: NextRequest): CountryCode {
  const chosen = request.cookies.get(COUNTRY_COOKIE)?.value?.toUpperCase()
  if (isMarket(chosen)) return chosen
  const geo = (request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry"))?.toUpperCase()
  if (geo) return isMarket(geo) ? geo : DEFAULT_COUNTRY
  return languageCountry(request) ?? DEFAULT_COUNTRY
}

/**
 * "/" stays the address for everyone, but each country gets its own prebuilt page behind it
 * (src/app/[country]/page.tsx), so prices are right on the first paint with no flash of dollars.
 */
export function proxy(request: NextRequest) {
  const country = visitorCountry(request)
  if (country === DEFAULT_COUNTRY) return NextResponse.next()
  const url = request.nextUrl.clone()
  url.pathname = `/${country.toLowerCase()}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: "/",
}
