import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"
import ts from "typescript"

const require = createRequire(import.meta.url)
const sourceRoot = fileURLToPath(new URL("../src/", import.meta.url))
// Load the real country rules and phone validation with the app's TS path aliases.
function load(file) {
  if (file.endsWith(".json")) return require(file)
  const compiled = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText
  const testModule = { exports: {} }
  new Function("require", "module", "exports", compiled)(specifier => {
    if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return require(specifier)
    const target = specifier.startsWith("@/") ? path.join(sourceRoot, specifier.slice(2)) : path.resolve(path.dirname(file), specifier)
    return load(path.extname(target) ? target : `${target}.ts`)
  }, testModule, testModule.exports)
  return testModule.exports
}

const { EMPTY_ADDRESS, toAddressValues, formatAddressLines, changeAddressCountry, validateAddress, normalizeAddress, addressRepairFields, sameAddress } = load(path.join(sourceRoot, "lib/address.ts"))
const address = overrides => ({ ...EMPTY_ADDRESS, first_name: "Alex", last_name: "Taylor", address_1: "20 Example Road", city: "London", postal_code: "SW6 5HQ", country_code: "gb", ...overrides })

test("legacy autofill duplicates and state placeholders are cleaned without guessing a country", () => {
  const saved = address({ address_2: " 20  EXAMPLE Road ", province: "[Select state]", country_code: "US" })
  const values = toAddressValues(saved)
  assert.equal(values.address_2, "")
  assert.equal(values.province, "")
  assert.equal(values.country_code, "us")
  assert.deepEqual(formatAddressLines(saved), ["Alex Taylor", "20 Example Road", "London, SW6 5HQ", "US"])
  assert.equal(saved.province, "[Select state]", "reading an address must not mutate saved data")
  assert.equal(normalizeAddress(saved).address_2, "", "saving must not persist a duplicate autofill line")
})

test("a separate apartment or suite is retained", () => {
  const saved = address({ address_2: "Flat 4B" })
  assert.equal(toAddressValues(saved).address_2, "Flat 4B")
  assert.ok(formatAddressLines(saved).includes("Flat 4B"))
})

test("an incompatible postcode and missing state require correction", () => {
  const values = toAddressValues(address({ country_code: "us", province: "[Select state]" }))
  assert.deepEqual(Object.keys(validateAddress(values)).sort(), ["postal_code", "province"])
  const corrected = changeAddressCountry(values, "gb")
  assert.deepEqual(validateAddress(corrected), {})
  assert.equal(normalizeAddress(corrected).postal_code, "SW6 5HQ")
})

test("changing country preserves typed delivery details and only resets the state", () => {
  const values = address({ country_code: "us", province: "NY", address_2: "Flat 4B", phone: "+442079460018" })
  assert.deepEqual(changeAddressCountry(values, "gb"), { ...values, country_code: "gb", province: "" })
  assert.equal(changeAddressCountry(values, "us"), values, "reselecting the same country must not clear its state")
})

test("complete US addresses still validate and keep their state", () => {
  const values = address({ city: "New York", country_code: "us", province: "NY", postal_code: "10001" })
  assert.deepEqual(validateAddress(values), {})
  assert.deepEqual(formatAddressLines(values), ["Alex Taylor", "20 Example Road", "New York, NY 10001", "US"])
})

test("saved address repairs only ask for the details that need attention", () => {
  const values = toAddressValues(address({ country_code: "us", province: "[Select state]" }))
  assert.deepEqual(addressRepairFields(validateAddress(values)), ["country_code", "postal_code", "province"])
  assert.deepEqual(addressRepairFields({ phone: "Invalid phone" }), ["country_code", "phone"])
})

test("saved address matching includes apartment and city, with normalized formatting", () => {
  const saved = address({ address_2: "Flat 4B" })
  assert.equal(sameAddress(saved, { ...saved, postal_code: "sw65hq", country_code: "GB" }), true)
  assert.equal(sameAddress(saved, { ...saved, address_2: "Flat 5B" }), false)
  assert.equal(sameAddress(saved, { ...saved, city: "Oxford" }), false)
  assert.equal(sameAddress(null, saved), false)
})
