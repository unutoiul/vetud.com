import { NMI_PROVIDER_ID, nmiAvailable, type NmiConfig } from "./nmi"
import { isPaygate, paygateAvailable, type PaygateConfig } from "./paygate"

/** Only providers implemented by the current checkout may be offered to shoppers. */
const CHECKOUT_PROVIDERS = new Set(["pp_system_default", "pp_makepay_makepay", "pp_nmi_primary", "pp_paygate_card", "pp_paygate_crypto"])

export function isCheckoutPaymentProvider(id: string) {
  return CHECKOUT_PROVIDERS.has(id)
}

/**
 * Whether the checkout really offers a region's payment provider: built for this checkout, and
 * switched on and set up at the backend (card processing in the cart's currency). The checkout and
 * the country delivery pages use this, so a page never lists a method the checkout then hides.
 */
export function isOfferedPaymentProvider(id: string, setup: { nmi: NmiConfig | null; paygate: PaygateConfig | null; currency: string }) {
  if (!isCheckoutPaymentProvider(id)) return false
  if (isPaygate(id)) return paygateAvailable(setup.paygate, id)
  return id !== NMI_PROVIDER_ID || nmiAvailable(setup.nmi, setup.currency)
}
