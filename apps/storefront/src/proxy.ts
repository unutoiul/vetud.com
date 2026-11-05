import { NextResponse, type NextRequest } from "next/server"
import {
  DEFAULT_COUNTRY,
  FALLBACK_COUNTRIES,
  MEDUSA_BACKEND_URL,
  MEDUSA_PUBLISHABLE_KEY,
  SUPPORTED_COUNTRIES,
} from "./lib/config"
import { CURRENCY_COOKIE, isStoreCurrency, storeSegment } from "./lib/store-segment"

const CACHE_MS = 60 * 60 * 1000
const COUNTRY_COOKIE = "vetud_country"
let countryCache: { codes: string[]; home: Record<string, string>; fetchedAt: number } | null = null

/** Countries the store sells to and each one's own currency, from Medusa's regions (cached for an hour). */
async function sellableCountries(): Promise<{ codes: string[]; home: Record<string, string> }> {
  if (countryCache && Date.now() - countryCache.fetchedAt < CACHE_MS) {
    return countryCache
  }
  const fallback = { codes: FALLBACK_COUNTRIES, home: {} }
  try {
    const response = await fetch(`${MEDUSA_BACKEND_URL}/store/regions?fields=currency_code,*countries`, {
      headers: { "x-publishable-api-key": MEDUSA_PUBLISHABLE_KEY },
    })
    if (!response.ok) throw new Error(`regions ${response.status}`)
    const { regions } = (await response.json()) as {
      regions: { currency_code: string; countries?: { iso_2?: string }[] }[]
    }
    const home = Object.fromEntries(regions.flatMap((region) =>
      (region.countries ?? []).flatMap((country) => country.iso_2 && SUPPORTED_COUNTRIES.includes(country.iso_2.toLowerCase()) ? [[country.iso_2.toLowerCase(), region.currency_code.toLowerCase()]] : [])
    ))
    const codes = Object.keys(home)
    countryCache = codes.length ? { codes, home, fetchedAt: Date.now() } : { ...fallback, fetchedAt: Date.now() }
  } catch {
    return countryCache ?? fallback
  }
  return countryCache
}

/**
 * The page to render for a country: the same path, or the hidden currency segment when the shopper
 * chose a currency other than the country's own (/se/shop → /se-usd/shop, see lib/store-segment.ts).
 */
function storeResponse(request: NextRequest, country: string, rest: string, home: Record<string, string>) {
  const chosen = request.cookies.get(CURRENCY_COOKIE)?.value?.toLowerCase()
  const segment = storeSegment(country, isStoreCurrency(chosen) ? chosen : null, home[country])
  if (segment === country && request.nextUrl.pathname.split("/")[1] === country) return NextResponse.next()
  const url = request.nextUrl.clone()
  url.pathname = `/${segment}${rest ? `/${rest}` : ""}`
  return NextResponse.rewrite(url)
}

function languageCountry(request: NextRequest) {
  const language = request.headers.get("accept-language") ?? ""
  const candidates = language
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase())
    .filter(Boolean)

  for (const candidate of candidates) {
    const regional = candidate?.split("-")[1]
    if (regional) return regional
    if (candidate && Object.hasOwn(LANGUAGE_COUNTRY, candidate)) return LANGUAGE_COUNTRY[candidate]
  }
  return ""
}

/** The country a bare language most likely means (Accept-Language "sv" → Sweden). */
const LANGUAGE_COUNTRY: Record<string, string> = {
  en: "us", de: "de", fr: "fr", nl: "nl", es: "es", it: "it", pt: "pt", pl: "pl", cs: "cz", sk: "sk",
  hu: "hu", ro: "ro", bg: "bg", hr: "hr", sl: "si", el: "gr", sv: "se", da: "dk", nb: "no", nn: "no",
  no: "no", fi: "fi", et: "ee", lv: "lv", lt: "lt", is: "is", mt: "mt", ga: "ie",
}

/**
 * Every page lives under a country segment (/us/shop, /de/shop) that selects the Medusa region
 * and currency. The root is a stable, crawlable US default; visitors can choose another
 * region in the header. Other unprefixed routes retain the regional redirect.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const segments = pathname.split("/")
  const first = segments[1]?.toLowerCase() ?? ""

  const { codes: countries, home } = await sellableCountries()

  // A stable x-default homepage avoids redirecting crawlers or people by their IP.
  // A rewrite preserves / while the existing country layout renders the US store.
  if (pathname === "/") {
    return storeResponse(request, "us", "", home)
  }

  // Currency segments are never addressed directly: /se-usd/shop → /se/shop, remembering the currency.
  const hidden = /^([a-z]{2})-(usd|eur|gbp)$/.exec(first)
  if (hidden && countries.includes(hidden[1])) {
    const url = request.nextUrl.clone()
    url.pathname = `/${hidden[1]}${segments.length > 2 ? `/${segments.slice(2).join("/")}` : ""}`
    const response = NextResponse.redirect(url, 307)
    response.cookies.set(CURRENCY_COOKIE, hidden[2], { maxAge: 60 * 60 * 24 * 365, httpOnly: false, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: "/" })
    return response
  }

  if (countries.includes(first)) {
    const response = storeResponse(request, first, segments.slice(2).join("/"), home)
    if (!request.cookies.get(COUNTRY_COOKIE)?.value) {
      response.cookies.set(COUNTRY_COOKIE, first, {
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: false,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        path: "/",
      })
    }
    return response
  }

  const saved = request.cookies.get(COUNTRY_COOKIE)?.value?.toLowerCase() ?? ""
  const geo = (
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    ""
  ).toLowerCase()
  const language = languageCountry(request)
  const target = countries.includes(saved)
    ? saved
    : countries.includes(geo)
      ? geo
      : countries.includes(language)
        ? language
        : countries.includes(DEFAULT_COUNTRY)
          ? DEFAULT_COUNTRY
          : countries[0]

  // Replace an unsupported country segment (e.g. /gb/shop) instead of nesting it.
  const rest = /^[a-z]{2}$/.test(first) ? segments.slice(2).join("/") : segments.slice(1).join("/")
  const url = request.nextUrl.clone()
  url.pathname = `/${target}${rest ? `/${rest}` : ""}`
  const response = NextResponse.redirect(url, 307)
  response.cookies.set(COUNTRY_COOKIE, target, {
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
  })
  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|google[a-f0-9]+\\.html$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest|mp4)$).*)",
  ],
}
