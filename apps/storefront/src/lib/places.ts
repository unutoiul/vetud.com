import type { AddressValues } from "../components/checkout/AddressFields"

/**
 * Address suggestions through Google's Places API (New), called from the browser with a
 * referrer-restricted key. Off unless NEXT_PUBLIC_GOOGLE_PLACES_API_KEY is set.
 * https://developers.google.com/maps/documentation/places/web-service/place-autocomplete
 */
export const PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || ""
export const PLACES_ENABLED = PLACES_API_KEY.length > 0

export type PlaceComponent = { longText?: string; shortText?: string; types?: string[] }
export type PlaceSuggestion = { placeId: string; main: string; secondary: string }

/** Countries where the house number is written after the street name ("Musterstraße 12"). */
const NUMBER_AFTER_STREET = new Set([
  "de", "nl", "be", "at", "es", "it", "pt", "se", "no", "dk", "fi", "pl", "cz", "hu", "ro", "ch", "is",
  "gr", "hr", "si", "sk", "lt", "lv", "ee", "bg",
])

/** Countries where the state or province is a normal part of the address. */
const USES_PROVINCE = new Set(["us", "ca", "au"])

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
    province: USES_PROVINCE.has(country) ? (find(components, "administrative_area_level_1")?.shortText ?? "") : "",
    postal_code: find(components, "postal_code")?.longText ?? "",
    country_code: country,
  }
}

export function newSessionToken() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()) + Math.random()
}

/** Suggestions for what the visitor has typed so far, limited to the countries we ship to. */
export async function suggestAddresses(
  input: string,
  sessionToken: string,
  countryCodes: string[],
  signal?: AbortSignal
): Promise<PlaceSuggestion[]> {
  const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": PLACES_API_KEY },
    body: JSON.stringify({
      input,
      sessionToken,
      languageCode: "en",
      // The API accepts at most 15 region codes.
      ...(countryCodes.length ? { includedRegionCodes: countryCodes.slice(0, 15) } : {}),
    }),
    signal,
  })
  if (!response.ok) throw new Error(`Address suggestions failed (${response.status})`)
  const body = (await response.json()) as {
    suggestions?: { placePrediction?: { placeId: string; text?: { text?: string }; structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } } } }[]
  }
  return (body.suggestions ?? []).flatMap((item) => {
    const prediction = item.placePrediction
    if (!prediction?.placeId) return []
    const main = prediction.structuredFormat?.mainText?.text ?? prediction.text?.text ?? ""
    return [{ placeId: prediction.placeId, main, secondary: prediction.structuredFormat?.secondaryText?.text ?? "" }]
  })
}

/** The address fields for a chosen suggestion. Using the same session token ends the billing session. */
export async function addressForPlace(placeId: string, sessionToken: string): Promise<Partial<AddressValues>> {
  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(sessionToken)}`, {
    headers: { "X-Goog-Api-Key": PLACES_API_KEY, "X-Goog-FieldMask": "addressComponents" },
  })
  if (!response.ok) throw new Error(`Address details failed (${response.status})`)
  const body = (await response.json()) as { addressComponents?: PlaceComponent[] }
  return parsePlace(body.addressComponents ?? [])
}
