import usStates from "@/i18n/us-states.json"
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js"
import { COUNTRY_RULES, getCountryRules } from "@/i18n/config"

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

export const US_STATES: Record<string, string> = usStates

export function normalizePostal(value: string, country: string) {
  const compact = value.trim().toUpperCase().replace(/\s+/g, "")
  if (country === "gb" && compact.length >= 5) return `${compact.slice(0, -3)} ${compact.slice(-3)}`
  if (country === "nl" && compact.length === 6) return `${compact.slice(0, 4)} ${compact.slice(4)}`
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
  const country = values.country_code.toLowerCase()
  return { ...values, country_code: country, postal_code: normalizePostal(values.postal_code, country), phone: normalizePhone(values.phone, country), province: getCountryRules(country).provinceRequired ? values.province.trim().toUpperCase() : "" }
}

type Translate = (key: "required" | "unsupportedCountry" | "invalidState" | "invalidPhone" | "invalidPostal", values?: { label: string; example: string }) => string
export function validateAddress(values: AddressValues, translate?: Translate, postalLabel?: string) {
  const t: Translate = translate ?? ((key) => ({ required: "Required", unsupportedCountry: "Select a supported delivery country", invalidState: "Select a valid state", invalidPhone: "Enter a valid phone number", invalidPostal: "Enter a valid postal code" })[key])
  const errors: Partial<Record<keyof AddressValues, string>> = {}
  for (const field of ["first_name", "last_name", "address_1", "city", "postal_code", "country_code"] as const) {
    if (!values[field].trim()) errors[field] = t("required")
  }
  const country = values.country_code.toLowerCase()
  if (!Object.hasOwn(COUNTRY_RULES, country)) {
    errors.country_code = t("unsupportedCountry")
    return errors
  }
  const rules = getCountryRules(country)
  if (values.postal_code.trim() && !new RegExp(rules.postalPattern, "i").test(normalizePostal(values.postal_code, country))) errors.postal_code = t("invalidPostal", { label: postalLabel ?? "postal code", example: rules.postalExample })
  if (rules.provinceRequired && !US_STATES[values.province.trim().toUpperCase()]) errors.province = values.province.trim() ? t("invalidState") : t("required")
  if (!isValidPhone(values.phone, country)) errors.phone = t("invalidPhone")
  return errors
}

export function toAddressValues(address?: Partial<Record<keyof AddressValues, string | null>> | null): AddressValues {
  return Object.fromEntries(Object.keys(EMPTY_ADDRESS).map(key => [key, address?.[key as keyof AddressValues] ?? ""])) as AddressValues
}

export function formatAddressLines(address: Partial<Record<keyof AddressValues, string | null>>) {
  const country = address.country_code?.toLowerCase() ?? "us"
  const location = getCountryRules(country).postalBeforeCity
    ? [address.postal_code, address.city].filter(Boolean).join(" ")
    : country === "us"
      ? [address.city, [address.province, address.postal_code].filter(Boolean).join(" ")].filter(Boolean).join(", ")
      : [address.city, address.postal_code].filter(Boolean).join(" ")
  return [[address.first_name, address.last_name].filter(Boolean).join(" "), address.company, address.address_1, address.address_2, location, country.toUpperCase()].filter(Boolean) as string[]
}
