import { NextResponse, type NextRequest } from "next/server"
import {
  DEFAULT_COUNTRY,
  FALLBACK_COUNTRIES,
  MEDUSA_BACKEND_URL,
  MEDUSA_PUBLISHABLE_KEY,
} from "./lib/config"

const CACHE_MS = 60 * 60 * 1000
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
    ) as string[]
    countryCache = { codes: codes.length ? codes : FALLBACK_COUNTRIES, fetchedAt: Date.now() }
  } catch {
    return countryCache?.codes ?? FALLBACK_COUNTRIES
  }
  return countryCache.codes
}

/**
 * Every page lives under a country segment (/us/shop, /de/shop) that selects the Medusa region
 * and currency. Requests without a valid segment are redirected, using the visitor's country
 * from the hosting platform's geo header when we sell there.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const segments = pathname.split("/")
  const first = segments[1]?.toLowerCase() ?? ""
  const countries = await sellableCountries()

  if (countries.includes(first)) {
    return NextResponse.next()
  }

  const geo = (
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    ""
  ).toLowerCase()
  const target = countries.includes(geo)
    ? geo
    : countries.includes(DEFAULT_COUNTRY)
      ? DEFAULT_COUNTRY
      : countries[0]

  // Replace an unsupported country segment (e.g. /gb/shop) instead of nesting it.
  const rest = /^[a-z]{2}$/.test(first) ? segments.slice(2).join("/") : segments.slice(1).join("/")
  const url = request.nextUrl.clone()
  url.pathname = `/${target}${rest ? `/${rest}` : ""}`
  return NextResponse.redirect(url, 307)
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
}
