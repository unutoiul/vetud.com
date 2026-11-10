import { MedusaError } from "@medusajs/framework/utils"

// Supported by the pinned module's Orders API currency validator (1.3.3).
const PAYPAL_CURRENCIES = new Set(["AUD", "BRL", "CAD", "CHF", "CZK", "DKK", "EUR", "GBP", "HKD", "HUF", "ILS", "JPY", "MXN", "MYR", "NOK", "NZD", "PHP", "PLN", "SEK", "SGD", "THB", "TWD", "USD"])

export const PAYPAL_PROVIDER_ID = "pp_paypal_paypal"

export type PayPalSetupRegion = {
  id: string
  name?: string
  currency_code: string
  countries?: ({ iso_2?: string } | null)[]
  payment_providers?: ({ id?: string } | null)[]
}

/** Add PayPal to active regions only, retaining every existing payment method. */
export function planPayPalRegions(regions: PayPalSetupRegion[], requested: string[]) {
  const currencies = [...new Set(requested.map(currency => currency.trim().toLowerCase()).filter(Boolean))]
  if (!currencies.length || currencies.some(currency => !PAYPAL_CURRENCIES.has(currency.toUpperCase()))) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Choose supported PayPal currencies, for example usd,eur,gbp.")
  }
  const selected = regions.filter(region => currencies.includes(region.currency_code.toLowerCase()) && region.countries?.some(country => country?.iso_2))
  if (currencies.some(currency => !selected.some(region => region.currency_code.toLowerCase() === currency))) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Every requested currency needs an active region. No payment methods were changed.")
  }
  return selected.map(region => {
    if (!Array.isArray(region.payment_providers) || region.payment_providers.some(provider => !provider?.id)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Could not read the region's existing payment methods. No payment methods were changed.")
    }
    const previous = region.payment_providers.map(provider => provider!.id!)
    return { id: region.id, name: region.name, currency: region.currency_code, previous, next: [...new Set([...previous, PAYPAL_PROVIDER_ID])], changed: !previous.includes(PAYPAL_PROVIDER_ID) }
  })
}
