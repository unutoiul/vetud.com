import { NextResponse, type NextRequest } from "next/server"
import {
  DEFAULT_COUNTRY,
  FALLBACK_COUNTRIES,
  MEDUSA_BACKEND_URL,
  MEDUSA_PUBLISHABLE_KEY,
  SUPPORTED_COUNTRIES,
} from "./lib/config"

const CACHE_MS = 60 * 60 * 1000
const COUNTRY_COOKIE = "vetud_country"
let countryCache: { codes: string[]; fetchedAt: number } | null = null

/** Countries the store sells to, from Medusa's regions (cached in memory for an hour). */
async function sellableCountries(): Promise<string[]> {
  if (countryCache && Date.now() - countryCache.fetchedAt < CACHE_MS) {
    return countryCache.codes
  }
  try {
    const response = await fetch(`${MEDUSA_BACKEND_URL}/store/regions?fields=*countries`, {
      headers: { "x-publishable-api-key": MEDUSA_PUBLISHABLE_KEY },
    })
    if (!response.ok) throw new Error(`regions ${response.status}`)
    const { regions } = (await response.json()) as {
      regions: { countries?: { iso_2?: string }[] }[]
    }
    const codes = regions.flatMap((region) =>
      (region.countries ?? []).map((country) => country.iso_2?.toLowerCase()).filter(Boolean)
    ).filter((code) => SUPPORTED_COUNTRIES.includes(code as string)) as string[]
    countryCache = { codes: codes.length ? codes : FALLBACK_COUNTRIES, fetchedAt: Date.now() }
  } catch {
    return countryCache?.codes ?? FALLBACK_COUNTRIES
  }
  return countryCache.codes
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

  // A stable x-default homepage avoids redirecting crawlers or people by their IP.
  // A rewrite preserves / while the existing country layout renders the US store.
  if (pathname === "/") {
    const url = request.nextUrl.clone()
    url.pathname = "/us"
    return NextResponse.rewrite(url)
  }

  const countries = await sellableCountries()

  if (countries.includes(first)) {
    const response = NextResponse.next()
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
