import type { AddressValues } from "./address"

/**
 * Address suggestions through Google's Places API (New), called from the browser with a
 * referrer-restricted key. Off unless NEXT_PUBLIC_GOOGLE_PLACES_API_KEY is set.
 * https://developers.google.com/maps/documentation/places/web-service/place-autocomplete
 */
export const PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || ""
export const PLACES_ENABLED = PLACES_API_KEY.length > 0

export type PlaceComponent = { longText?: string; shortText?: string; types?: string[] }
export type PlaceSuggestion = { placeId: string; main: string; secondary: string }
export type PlaceLocation = { latitude: number; longitude: number }
export type PlaceDetails = { address: Partial<AddressValues>; location?: PlaceLocation }

/** Countries where the house number is written after the street name ("Musterstraße 12"). */
const NUMBER_AFTER_STREET = new Set([
  "de",
  "nl",
  "be",
  "at",
  "es",
  "it",
  "pt",
  "se",
  "no",
  "dk",
  "fi",
  "pl",
  "cz",
  "hu",
  "ro",
  "ch",
  "is",
  "gr",
  "hr",
  "si",
  "sk",
  "lt",
  "lv",
  "ee",
  "bg",
])

/** Countries whose addresses have a state or province. Everywhere else the field is hidden. */
export const STATE_COUNTRIES = new Set(["us", "ca", "au"])

const CITY_TYPES = [
  "postal_town",
  "locality",
  "sublocality_level_1",
  "sublocality",
  "administrative_area_level_3",
  "administrative_area_level_2",
]

/**
 * Only places someone can be delivered to: street addresses, buildings, flats, streets and postal
 * codes. Without this, shops, offices and landmarks crowd out the address being typed.
 * Google allows at most five types here.
 */
export const ADDRESS_TYPES = ["street_address", "premise", "subpremise", "route", "postal_code"]

function find(components: PlaceComponent[], type: string) {
  return components.find((component) => component.types?.includes(type))
}

const HOUSE_NUMBER = String.raw`\d+[a-zA-Z]?(?:\s*[-–/]\s*\d+[a-zA-Z]?)?`

/**
 * The house number in what the shopper typed, for a street Google knows only as a whole ("Fulham
 * Road" for "839 Fulham Road"). Looks in the part that names the street, before or after the
 * street name depending on the country.
 */
export function typedHouseNumber(typed: string, route: string, country: string) {
  const parts = typed
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
  const streetWord = route.trim().split(/\s+/)[0]?.toLowerCase() ?? ""
  const part = parts.find((candidate) => streetWord && candidate.toLowerCase().includes(streetWord)) ?? parts[0] ?? ""
  const match = NUMBER_AFTER_STREET.has(country)
    ? part.match(new RegExp(`(?:^|\\s)(${HOUSE_NUMBER})$`))
    : part.match(new RegExp(`^(${HOUSE_NUMBER})(?:\\s|$)`))
  return match?.[1]?.replace(/\s+/g, "") ?? ""
}

/**
 * Turns Google address components into the fields of our address form. `typed` is what the
 * shopper had typed; it supplies the house number when Google matched only the street.
 * A postal code or town gives an empty `address_1`: the shopper still has to type the street.
 */
export function parsePlace(components: PlaceComponent[], typed = ""): Partial<AddressValues> {
  const country = find(components, "country")?.shortText?.toLowerCase() ?? ""
  const route = find(components, "route")?.longText ?? ""
  const number = find(components, "street_number")?.longText || (route ? typedHouseNumber(typed, route, country) : "")
  const street = NUMBER_AFTER_STREET.has(country) ? [route, number] : [number, route]
  // A named building without a street, common for rural UK addresses ("Rose Cottage").
  const premise = route ? "" : (find(components, "premise")?.longText ?? "")
  const flat = find(components, "subpremise")?.longText ?? ""

  let city = ""
  for (const type of CITY_TYPES) {
    city = find(components, type)?.longText ?? ""
    if (city) break
  }

  return {
    address_1: route ? street.filter(Boolean).join(" ") : premise,
    // Google writes some flats in lower case ("flat 2").
    address_2: flat.charAt(0).toUpperCase() + flat.slice(1),
    city,
    province: STATE_COUNTRIES.has(country) ? (find(components, "administrative_area_level_1")?.shortText ?? "") : "",
    postal_code: find(components, "postal_code")?.longText ?? "",
    country_code: country,
  }
}

export function newSessionToken() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random()
}

type AutocompleteBody = {
  suggestions?: {
    placePrediction?: {
      placeId: string
      text?: { text?: string }
      structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } }
    }
  }[]
}

/** A lookup Google refused or couldn't answer. `status` is the HTTP status. */
export class PlacesError extends Error {
  readonly status: number
  constructor(status: number) {
    super(`Address lookup failed (${status})`)
    this.name = "PlacesError"
    this.status = status
  }
}

let refused = false

/**
 * False once Google has refused the key on this page, for example because the site's address isn't
 * in the key's website restrictions (Google Cloud > Credentials). Further lookups would only fail
 * again, so the address fields stop asking and work as plain text.
 */
export function placesAvailable() {
  return PLACES_ENABLED && !refused
}

/** Stop a slow lookup without blocking manual address entry. */
async function fetchPlaces(url: string, init: RequestInit = {}) {
  const controller = new AbortController()
  const abort = () => controller.abort()
  if (init.signal?.aborted) abort()
  init.signal?.addEventListener("abort", abort, { once: true })
  const timer = setTimeout(abort, 6000)
  try {
    const response = await fetch(url, { ...init, signal: controller.signal })
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      if (!refused)
        console.warn(
          `Address suggestions are off: Google refused the request (${response.status}). Check that ${typeof location === "undefined" ? "this site" : location.origin} is allowed in the API key's website restrictions and that Places API (New) is enabled.`,
        )
      refused = true
    }
    // Include reading the body in the timeout, not just waiting for headers.
    if (!response.ok) throw new PlacesError(response.status)
    return await response.json()
  } finally {
    clearTimeout(timer)
    init.signal?.removeEventListener("abort", abort)
  }
}

async function autocomplete(
  body: Record<string, unknown>,
  signal?: AbortSignal,
  locale = "en",
): Promise<PlaceSuggestion[]> {
  const json = (await fetchPlaces("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": PLACES_API_KEY },
    body: JSON.stringify({ languageCode: locale, ...body }),
    signal,
  })) as AutocompleteBody
  return (json.suggestions ?? []).flatMap((item) => {
    const prediction = item.placePrediction
    if (!prediction?.placeId) return []
    const main = prediction.structuredFormat?.mainText?.text ?? prediction.text?.text ?? ""
    return [{ placeId: prediction.placeId, main, secondary: prediction.structuredFormat?.secondaryText?.text ?? "" }]
  })
}

/**
 * Address suggestions for what the visitor has typed (a street address or a postal code), limited
 * to the one country they selected. A location (from a chosen postal code) favours that area.
 */
export function suggestAddresses(
  input: string,
  sessionToken: string,
  countryCode: string,
  signal?: AbortSignal,
  near?: PlaceLocation,
  locale = "en",
) {
  return autocomplete(
    {
      input,
      sessionToken,
      includedPrimaryTypes: ADDRESS_TYPES,
      ...(countryCode ? { includedRegionCodes: [countryCode] } : {}),
      ...(near ? { locationBias: { circle: { center: near, radius: 5000 } } } : {}),
    },
    signal,
    locale,
  )
}

/** Postal-code suggestions in the selected country, each with its city. */
export function suggestPostalCodes(
  input: string,
  sessionToken: string,
  countryCode: string,
  signal?: AbortSignal,
  locale = "en",
) {
  return autocomplete(
    {
      input,
      sessionToken,
      includedPrimaryTypes: ["postal_code"],
      ...(countryCode ? { includedRegionCodes: [countryCode] } : {}),
    },
    signal,
    locale,
  )
}

type DetailsBody = { addressComponents?: PlaceComponent[]; location?: PlaceLocation }

/**
 * The address fields and map position of a chosen suggestion. Reusing the session token ends its
 * billing session. `typed` is what the shopper had typed (see parsePlace).
 */
export async function placeDetails(
  placeId: string,
  sessionToken: string,
  locale = "en",
  signal?: AbortSignal,
  typed = "",
): Promise<PlaceDetails> {
  const body = (await fetchPlaces(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(sessionToken)}&languageCode=${encodeURIComponent(locale)}`,
    {
      headers: { "X-Goog-Api-Key": PLACES_API_KEY, "X-Goog-FieldMask": "addressComponents,location" },
      signal,
    },
  )) as DetailsBody
  return { address: parsePlace(body.addressComponents ?? [], typed), location: body.location }
}

/**
 * A postal code or town rather than a street: it fills the postcode and town, and the shopper then
 * types the street.
 */
export function isAreaPlace(address: Partial<AddressValues>) {
  return !address.address_1 && Boolean(address.postal_code || address.city)
}

/** A lookup must never replace fields the shopper edited while it was loading. */
export function mergePlaceAddress(
  current: AddressValues,
  initial: AddressValues,
  address: Partial<AddressValues>,
  street: string,
): AddressValues {
  return {
    ...current,
    address_1: isAreaPlace(address) ? "" : address.address_1 || street,
    address_2: current.address_2 !== initial.address_2 ? current.address_2 : address.address_2 || current.address_2,
    city: current.city !== initial.city ? current.city : address.city || "",
    postal_code: current.postal_code !== initial.postal_code ? current.postal_code : address.postal_code || "",
    province: current.province !== initial.province ? current.province : address.province || "",
  }
}

/**
 * Google often matches a street without a postal code. Look the exact address up to find it.
 * Returns an empty string when there is no confident match, so the visitor types it in.
 */
export async function findPostalCode(
  address: Partial<AddressValues>,
  signal?: AbortSignal,
  locale = "en",
): Promise<string> {
  const query = [address.address_1, address.city].filter(Boolean).join(", ")
  if (!query || !address.country_code) return ""
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": PLACES_API_KEY,
      "X-Goog-FieldMask": "places.addressComponents",
    },
    body: JSON.stringify({
      textQuery: query,
      regionCode: address.country_code,
      maxResultCount: 1,
      languageCode: locale,
    }),
    signal,
  })
  if (!response.ok) return ""
  const body = (await response.json()) as { places?: { addressComponents?: PlaceComponent[] }[] }
  const found = parsePlace(body.places?.[0]?.addressComponents ?? [])
  // Only trust a result for the same street and house number, in the same country and city.
  const same = (a?: string, b?: string) => (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase()
  if (
    found.country_code !== address.country_code ||
    !same(found.city, address.city) ||
    !same(found.address_1, address.address_1)
  )
    return ""
  return found.postal_code ?? ""
}
