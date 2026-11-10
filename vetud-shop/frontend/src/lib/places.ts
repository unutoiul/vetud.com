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
  "de", "nl", "be", "at", "es", "it", "pt", "se", "no", "dk", "fi", "pl", "cz", "hu", "ro", "ch", "is",
  "gr", "hr", "si", "sk", "lt", "lv", "ee", "bg",
])

/** Countries whose addresses have a state or province. Everywhere else the field is hidden. */
export const STATE_COUNTRIES = new Set(["us", "ca", "au"])

const CITY_TYPES = ["postal_town", "locality", "sublocality_level_1", "sublocality", "administrative_area_level_3", "administrative_area_level_2"]

function find(components: PlaceComponent[], type: string) {
  return components.find((component) => component.types?.includes(type))
}

/** Turns Google address components into the fields of our address form. */
export function parsePlace(components: PlaceComponent[]): Partial<AddressValues> {
  const country = find(components, "country")?.shortText?.toLowerCase() ?? ""
  const number = find(components, "street_number")?.longText ?? ""
  const route = find(components, "route")?.longText ?? ""
  const street = NUMBER_AFTER_STREET.has(country) ? [route, number] : [number, route]

  let city = ""
  for (const type of CITY_TYPES) {
    city = find(components, type)?.longText ?? ""
    if (city) break
  }

  return {
    address_1: street.filter(Boolean).join(" "),
    address_2: find(components, "subpremise")?.longText ?? "",
    city,
    province: STATE_COUNTRIES.has(country) ? (find(components, "administrative_area_level_1")?.shortText ?? "") : "",
    postal_code: find(components, "postal_code")?.longText ?? "",
    country_code: country,
  }
}

export function newSessionToken() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()) + Math.random()
}

type AutocompleteBody = {
  suggestions?: { placePrediction?: { placeId: string; text?: { text?: string }; structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } } } }[]
}

async function autocomplete(body: Record<string, unknown>, signal?: AbortSignal, locale = "en"): Promise<PlaceSuggestion[]> {
  const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": PLACES_API_KEY },
    body: JSON.stringify({ languageCode: locale, ...body }),
    signal,
  })
  if (!response.ok) throw new Error(`Address suggestions failed (${response.status})`)
  const json = (await response.json()) as AutocompleteBody
  return (json.suggestions ?? []).flatMap((item) => {
    const prediction = item.placePrediction
    if (!prediction?.placeId) return []
    const main = prediction.structuredFormat?.mainText?.text ?? prediction.text?.text ?? ""
    return [{ placeId: prediction.placeId, main, secondary: prediction.structuredFormat?.secondaryText?.text ?? "" }]
  })
}

/**
 * Street-address suggestions for what the visitor has typed, limited to the one country they
 * selected. A location (from a chosen postal code) narrows the results to that area.
 */
export function suggestAddresses(
  input: string,
  sessionToken: string,
  countryCode: string,
  signal?: AbortSignal,
  near?: PlaceLocation,
  locale = "en"
) {
  return autocomplete(
    {
      input,
      sessionToken,
      ...(countryCode ? { includedRegionCodes: [countryCode] } : {}),
      ...(near ? { locationBias: { circle: { center: near, radius: 5000 } } } : {}),
    },
    signal, locale
  )
}

/** Postal-code suggestions in the selected country, each with its city. */
export function suggestPostalCodes(input: string, sessionToken: string, countryCode: string, signal?: AbortSignal, locale = "en") {
  return autocomplete(
    {
      input,
      sessionToken,
      includedPrimaryTypes: ["postal_code"],
      ...(countryCode ? { includedRegionCodes: [countryCode] } : {}),
    },
    signal, locale
  )
}

type DetailsBody = { addressComponents?: PlaceComponent[]; location?: PlaceLocation }

/** The address fields and map position of a chosen suggestion. Reusing the session token ends its billing session. */
export async function placeDetails(placeId: string, sessionToken: string, locale = "en"): Promise<PlaceDetails> {
  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(sessionToken)}&languageCode=${encodeURIComponent(locale)}`, {
    headers: { "X-Goog-Api-Key": PLACES_API_KEY, "X-Goog-FieldMask": "addressComponents,location" },
  })
  if (!response.ok) throw new Error(`Address details failed (${response.status})`)
  const body = (await response.json()) as DetailsBody
  return { address: parsePlace(body.addressComponents ?? []), location: body.location }
}

/**
 * Google often matches a street without a postal code. Look the exact address up to find it.
 * Returns an empty string when there is no confident match, so the visitor types it in.
 */
export async function findPostalCode(address: Partial<AddressValues>, signal?: AbortSignal, locale = "en"): Promise<string> {
  const query = [address.address_1, address.city].filter(Boolean).join(", ")
  if (!query || !address.country_code) return ""
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": PLACES_API_KEY, "X-Goog-FieldMask": "places.addressComponents" },
    body: JSON.stringify({ textQuery: query, regionCode: address.country_code, maxResultCount: 1, languageCode: locale }),
    signal,
  })
  if (!response.ok) return ""
  const body = (await response.json()) as { places?: { addressComponents?: PlaceComponent[] }[] }
  const found = parsePlace(body.places?.[0]?.addressComponents ?? [])
  // Only trust a result for the same street and house number, in the same country and city.
  const same = (a?: string, b?: string) => (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase()
  if (found.country_code !== address.country_code || !same(found.city, address.city) || !same(found.address_1, address.address_1)) return ""
  return found.postal_code ?? ""
}
