import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import Module from "node:module"
import { fileURLToPath } from "node:url"
import ts from "typescript"

// Exercise the actual pure TypeScript modules without adding a test framework.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src")
const cache = new Map()
function load(filename) {
  filename = path.resolve(filename)
  if (cache.has(filename)) return cache.get(filename).exports
  const instance = new Module(filename)
  instance.paths = Module._nodeModulePaths(path.dirname(filename))
  cache.set(filename, instance)
  const originalRequire = instance.require.bind(instance)
  instance.require = (request) => {
    const target = request.startsWith("@/") ? path.join(root, request.slice(2)) : request.startsWith(".") ? path.resolve(path.dirname(filename), request) : null
    if (target && fs.existsSync(`${target}.ts`)) return load(`${target}.ts`)
    return originalRequire(target ?? request)
  }
  instance._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText, filename)
  return instance.exports
}

const a = load(path.join(root, "lib/address.ts"))
const places = load(path.join(root, "lib/places.ts"))
const valid = { ...a.EMPTY_ADDRESS, first_name: "Test", last_name: "Researcher", address_1: "Example Street 1", city: "Example", country_code: "us", province: "NY", postal_code: "10001" }
let checked = 0
function check(name, fn) { fn(); checked += 1; console.log(`PASS ${name}`) }
for (const [country, postal] of [["us", "10001-1234"], ["gb", "sw1a1aa"], ["de", "10115"], ["fr", "75001"], ["nl", "1012ab"]]) {
  check(`${country}: accepted local postal format`, () => assert.deepEqual(a.validateAddress({ ...valid, country_code: country, postal_code: postal }), {}))
  check(`${country}: rejected malformed postal code`, () => assert.ok(a.validateAddress({ ...valid, country_code: country, postal_code: "INVALID" }).postal_code))
}
check("US requires a state", () => assert.ok(a.validateAddress({ ...valid, province: "" }).province))
check("US rejects unknown state", () => assert.ok(a.validateAddress({ ...valid, province: "ZZ" }).province))
check("UK does not require a county", () => assert.deepEqual(a.validateAddress({ ...valid, country_code: "gb", province: "", postal_code: "SW1A 1AA" }), {}))
check("Unsupported country is rejected", () => assert.ok(a.validateAddress({ ...valid, country_code: "zz" }).country_code))
check("National UK number normalizes to E.164", () => assert.equal(a.normalizePhone("020 7946 0958", "gb"), "+442079460958"))
check("International number is preserved across destinations", () => assert.equal(a.normalizePhone("+44 20 7946 0958", "de"), "+442079460958"))
check("Optional empty phone is accepted", () => assert.equal(a.isValidPhone("", "fr"), true))
check("Malformed phone is rejected", () => assert.ok(a.validateAddress({ ...valid, phone: "123" }).phone))
check("Phone parser rejects arbitrary embedded text", () => assert.equal(a.isValidPhone("call me on +442079460958", "gb"), false))
check("Dutch postcode is normalized", () => assert.equal(a.normalizePostal("1012ab", "nl"), "1012 AB"))
check("UK postcode is normalized", () => assert.equal(a.normalizePostal("sw1a1aa", "gb"), "SW1A 1AA"))
check("US locality line uses city, state ZIP order", () => assert.ok(a.formatAddressLines({ ...valid, city: "New York" }).includes("New York, NY 10001")))
check("Dutch locality line uses postcode city order", () => assert.ok(a.formatAddressLines({ ...valid, country_code: "nl", city: "Amsterdam", postal_code: "1012 AB" }).includes("1012 AB Amsterdam")))
const component = (type, longText, shortText = longText) => ({ types: [type], longText, shortText })
check("German autocomplete puts house number after street", () => assert.equal(places.parsePlace([component("country", "Germany", "DE"), component("route", "Beispielstrasse"), component("street_number", "12")]).address_1, "Beispielstrasse 12"))
check("US autocomplete puts house number before street", () => assert.equal(places.parsePlace([component("country", "United States", "US"), component("route", "Example Street"), component("street_number", "12")]).address_1, "12 Example Street"))
check("UK autocomplete reads postal town", () => assert.equal(places.parsePlace([component("country", "United Kingdom", "GB"), component("postal_town", "London")]).city, "London"))
check("US ZIP+4 is preserved", () => assert.equal(a.normalizePostal("10001-1234", "us"), "10001-1234"))
check("Saved address phone survives normalization", () => assert.equal(a.normalizeAddress({ ...valid, country_code: "gb", postal_code: "sw1a1aa", phone: "020 7946 0958" }).phone, "+442079460958"))
console.log(`${checked} address, phone and autocomplete checks passed.`)
