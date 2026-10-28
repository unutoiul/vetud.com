import assert from "node:assert/strict"
import { test } from "node:test"
import { parsePlace } from "../src/lib/places.ts"

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
