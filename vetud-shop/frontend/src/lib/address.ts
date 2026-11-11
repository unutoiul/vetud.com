import provinces from "@/i18n/provinces.json"
import usStates from "@/i18n/us-states.json"
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js"
import { getCountryRules } from "@/i18n/config"

export type AddressValues = {
  first_name: string
  last_name: string
  company: string
  address_1: string
  address_2: string
  city: string
  province: string
  postal_code: string
  country_code: string
  phone: string
}

export const EMPTY_ADDRESS: AddressValues = {
  first_name: "", last_name: "", company: "", address_1: "", address_2: "",
  city: "", province: "", postal_code: "", country_code: "", phone: "",
}

/** States, provinces and territories (code → name) for the countries whose addresses need one. */
const PROVINCES: Record<string, Record<string, string>> = { us: usStates, ...provinces }

export function provincesOf(country: string): Record<string, string> {
  return PROVINCES[country.toLowerCase()] ?? {}
}

export function normalizePostal(value: string, country: string) {
  const compact = value.trim().toUpperCase().replace(/\s+/g, "")
  if (country === "gb" && compact.length >= 5) return `${compact.slice(0, -3)} ${compact.slice(-3)}`
  if (country === "nl" && compact.length === 6) return `${compact.slice(0, 4)} ${compact.slice(4)}`
  // Canadian postal codes (K1A 0B1) and Irish Eircodes (D02 X285) break after the first three characters.
  if ((country === "ca" && compact.length === 6) || (country === "ie" && compact.length === 7)) return `${compact.slice(0, 3)} ${compact.slice(3)}`
  if (country === "pl" && /^\d{5}$/.test(compact)) return `${compact.slice(0, 2)}-${compact.slice(2)}`
  if (country === "pt" && /^\d{7}$/.test(compact)) return `${compact.slice(0, 4)}-${compact.slice(4)}`
  return value.trim().toUpperCase()
}

export function normalizePhone(value: string, country: string) {
  if (!value.trim()) return ""
  return parsePhoneNumberFromString(value, { defaultCountry: country.toUpperCase() as CountryCode, extract: false })?.number ?? value.trim()
}

export function isValidPhone(value: string, country: string) {
  if (!value.trim()) return true
  return Boolean(parsePhoneNumberFromString(value, { defaultCountry: country.toUpperCase() as CountryCode, extract: false })?.isValid())
}

export function normalizeAddress(values: AddressValues): AddressValues {
  const cleaned = toAddressValues(values)
  const country = cleaned.country_code
  const rules = getCountryRules(country)
  // A state from the list (US, Canada, Australia) is a code; elsewhere it's free text, when given.
  const province = rules.provinceRequired ? cleaned.province.toUpperCase() : rules.provinceOptional ? cleaned.province : ""
  return { ...cleaned, country_code: country, postal_code: normalizePostal(cleaned.postal_code, country), phone: normalizePhone(cleaned.phone, country), province }
}

type Translate = (key: "required" | "unsupportedCountry" | "invalidState" | "invalidPhone" | "invalidPostal", values?: { label: string; example: string }) => string
export function validateAddress(values: AddressValues, translate?: Translate, postalLabel?: string) {
  const t: Translate = translate ?? ((key) => ({ required: "Required", unsupportedCountry: "Select a supported delivery country", invalidState: "Select a valid state", invalidPhone: "Enter a valid phone number", invalidPostal: "Enter a valid postal code" })[key])
  const errors: Partial<Record<keyof AddressValues, string>> = {}
  const country = values.country_code.toLowerCase()
  // Any country code: the form only offers countries we deliver to, and the backend checks again.
  if (!/^[a-z]{2}$/.test(country)) {
    errors.country_code = t("unsupportedCountry")
    return errors
  }
  const rules = getCountryRules(country)
  for (const field of ["first_name", "last_name", "address_1", "city", ...(rules.postalOptional ? [] : ["postal_code" as const])] as const) {
    if (!values[field].trim()) errors[field] = t("required")
  }
  if (values.postal_code.trim() && !new RegExp(rules.postalPattern, "i").test(normalizePostal(values.postal_code, country))) errors.postal_code = t("invalidPostal", { label: postalLabel ?? "postal code", example: rules.postalExample })
  if (rules.provinceRequired && !provincesOf(country)[values.province.trim().toUpperCase()]) errors.province = values.province.trim() ? t("invalidState") : t("required")
  if (!isValidPhone(values.phone, country)) errors.phone = t("invalidPhone")
  return errors
}

export function toAddressValues(address?: Partial<Record<keyof AddressValues, string | null>> | null): AddressValues {
  const values = Object.fromEntries(Object.keys(EMPTY_ADDRESS).map(key => [key, (address?.[key as keyof AddressValues] ?? "").trim()])) as AddressValues
  values.country_code = values.country_code.toLowerCase()
  // Older browser autofill entries sometimes saved the select's placeholder as a state.
  if (/^\[?select (?:a )?(?:state|province|region)\]?$/i.test(values.province)) values.province = ""
  const comparable = (value: string) => value.toLowerCase().replace(/\s+/g, " ")
  if (comparable(values.address_2) === comparable(values.address_1)) values.address_2 = ""
  return values
}

/** Changing country keeps the entered address available for correction and revalidation. */
export function changeAddressCountry(values: AddressValues, country: string): AddressValues {
  if (values.country_code === country) return values
  return { ...values, country_code: country, province: "" }
}

/** Only the fields needing attention, plus country because it controls address rules. */
export function addressRepairFields(errors: Partial<Record<keyof AddressValues, string>>): (keyof AddressValues)[] {
  const fields = new Set<keyof AddressValues>(["country_code", ...Object.keys(errors) as (keyof AddressValues)[]])
  if (errors.country_code || errors.postal_code || errors.province) {
    fields.add("postal_code")
    fields.add("province")
  }
  return [...fields]
}

export function sameAddress(a?: Partial<Record<keyof AddressValues, string | null>> | null, b?: Partial<Record<keyof AddressValues, string | null>> | null) {
  if (!a || !b) return false
  const first = normalizeAddress(toAddressValues(a))
  const second = normalizeAddress(toAddressValues(b))
  return (Object.keys(EMPTY_ADDRESS) as (keyof AddressValues)[]).every(key => first[key].toLowerCase() === second[key].toLowerCase())
}

export function formatAddressLines(input: Partial<Record<keyof AddressValues, string | null>>) {
  const address = toAddressValues(input)
  const country = address.country_code || "us"
  const location = getCountryRules(country).postalBeforeCity
    ? [address.postal_code, address.city].filter(Boolean).join(" ")
    : getCountryRules(country).provinceRequired
      ? [address.city, [address.province, address.postal_code].filter(Boolean).join(" ")].filter(Boolean).join(", ")
      : [address.city, address.postal_code].filter(Boolean).join(" ")
  return [[address.first_name, address.last_name].filter(Boolean).join(" "), address.company, address.address_1, address.address_2, location, country.toUpperCase()].filter(Boolean) as string[]
}
