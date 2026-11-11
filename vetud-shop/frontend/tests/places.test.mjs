import assert from "node:assert/strict"
import { test } from "node:test"
import { mergePlaceAddress, parsePlace, placeDetails, suggestAddresses } from "../src/lib/places.ts"

const part = (longText, types, shortText = longText) => ({ longText, shortText, types })

test("a US address keeps the number first and fills state and ZIP", () => {
  const address = parsePlace([
    part("1600", ["street_number"]),
    part("Amphitheatre Parkway", ["route"], "Amphitheatre Pkwy"),
    part("Mountain View", ["locality", "political"]),
    part("Santa Clara County", ["administrative_area_level_2", "political"]),
    part("California", ["administrative_area_level_1", "political"], "CA"),
    part("United States", ["country", "political"], "US"),
    part("94043", ["postal_code"]),
    part("1234", ["postal_code_suffix"]),
  ])
  assert.deepEqual(address, {
    address_1: "1600 Amphitheatre Parkway",
    address_2: "",
    city: "Mountain View",
    province: "CA",
    postal_code: "94043",
    country_code: "us",
  })
})

test("a UK address uses the postal town and leaves the county blank", () => {
  const address = parsePlace([
    part("390", ["street_number"]),
    part("Fulham Road", ["route"]),
    part("Chelsea", ["neighborhood", "political"]),
    part("London", ["postal_town"]),
    part("Greater London", ["administrative_area_level_2", "political"]),
    part("England", ["administrative_area_level_1", "political"]),
    part("United Kingdom", ["country", "political"], "GB"),
    part("SW10 9UA", ["postal_code"]),
  ])
  assert.equal(address.address_1, "390 Fulham Road")
  assert.equal(address.city, "London")
  assert.equal(address.province, "")
  assert.equal(address.postal_code, "SW10 9UA")
  assert.equal(address.country_code, "gb")
})

test("German and Dutch addresses put the house number after the street", () => {
  const de = parsePlace([part("12", ["street_number"]), part("Friedrichstraße", ["route"]), part("Berlin", ["locality"]), part("Germany", ["country"], "DE"), part("10117", ["postal_code"])])
  assert.equal(de.address_1, "Friedrichstraße 12")
  const nl = parsePlace([part("5", ["street_number"]), part("Damrak", ["route"]), part("Amsterdam", ["locality"]), part("Netherlands", ["country"], "NL"), part("1012 LG", ["postal_code"])])
  assert.equal(nl.address_1, "Damrak 5")
  assert.equal(nl.postal_code, "1012 LG")
})

test("a French address keeps the number first", () => {
  const fr = parsePlace([part("10", ["street_number"]), part("Rue de Rivoli", ["route"]), part("Paris", ["locality"]), part("France", ["country"], "FR"), part("75001", ["postal_code"])])
  assert.equal(fr.address_1, "10 Rue de Rivoli")
})

test("a flat or suite goes into the second address line", () => {
  const address = parsePlace([part("4B", ["subpremise"]), part("20", ["street_number"]), part("Main Street", ["route"]), part("Dublin", ["locality"]), part("Ireland", ["country"], "IE")])
  assert.equal(address.address_2, "4B")
  assert.equal(address.address_1, "20 Main Street")
})

test("missing pieces become empty strings, not undefined", () => {
  const address = parsePlace([part("Belgium", ["country"], "BE")])
  assert.deepEqual(address, { address_1: "", address_2: "", city: "", province: "", postal_code: "", country_code: "be" })
})

const initialAddress = { first_name: "Alex", last_name: "Taylor", company: "", address_1: "Old Street", address_2: "Flat 4", city: "London", province: "", postal_code: "SW1A 1AA", country_code: "gb", phone: "" }

test("choosing a different street clears missing location data instead of keeping an old postcode", () => {
  const filled = mergePlaceAddress(initialAddress, initialAddress, { address_1: "20 New Street", city: "Manchester" }, "New Street")
  assert.equal(filled.address_1, "20 New Street")
  assert.equal(filled.city, "Manchester")
  assert.equal(filled.postal_code, "")
  assert.equal(filled.address_2, "Flat 4")
  assert.equal(filled.first_name, "Alex")
})

test("a delayed lookup preserves every delivery field edited in the meantime", () => {
  const current = { ...initialAddress, city: "My city", postal_code: "M1 1AA", province: "My region", address_2: "My apartment" }
  const filled = mergePlaceAddress(current, initialAddress, { address_1: "20 New Street", city: "Other city", postal_code: "Other postcode", province: "Other region", address_2: "Other apartment" }, "New Street")
  for (const key of ["city", "postal_code", "province", "address_2"]) assert.equal(filled[key], current[key])
  assert.equal(filled.address_1, "20 New Street")
})

test("Google suggestions use the selected country, language, and billing session", async t => {
  t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(url, "https://places.googleapis.com/v1/places:autocomplete")
    assert.deepEqual(JSON.parse(init.body), { languageCode: "en-GB", input: "20 Example", sessionToken: "session-1", includedRegionCodes: ["gb"] })
    return Response.json({ suggestions: [{ placePrediction: { placeId: "place-1", structuredFormat: { mainText: { text: "20 Example Road" }, secondaryText: { text: "London, UK" } } } }] })
  })
  assert.deepEqual(await suggestAddresses("20 Example", "session-1", "gb", undefined, undefined, "en-GB"), [{ placeId: "place-1", main: "20 Example Road", secondary: "London, UK" }])
})

test("Google failures are reported so the form can show its manual-entry fallback", async t => {
  t.mock.method(globalThis, "fetch", async () => new Response("", { status: 403 }))
  await assert.rejects(suggestAddresses("Example", "session", "gb"), /403/)
  await assert.rejects(placeDetails("place", "session"), /403/)
})

test("a cancelled lookup aborts its network request", async t => {
  t.mock.method(globalThis, "fetch", (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => reject(new DOMException("Cancelled", "AbortError")), { once: true })
  }))
  const controller = new AbortController()
  const lookup = suggestAddresses("Example", "session", "gb", controller.signal)
  controller.abort()
  await assert.rejects(lookup, { name: "AbortError" })
})

test("a stalled Google lookup times out so it cannot leave a permanent loading indicator", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] })
  t.mock.method(globalThis, "fetch", (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => reject(new DOMException("Timed out", "AbortError")), { once: true })
  }))
  const lookup = suggestAddresses("Example", "session", "gb")
  t.mock.timers.tick(6000)
  await assert.rejects(lookup, { name: "AbortError" })
})
