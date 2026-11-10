/** Only providers implemented by the current checkout may be offered to shoppers. */
const CHECKOUT_PROVIDERS = new Set(["pp_system_default", "pp_paypal_paypal", "pp_makepay_makepay", "pp_nmi_primary"])

export function isCheckoutPaymentProvider(id: string) {
  return CHECKOUT_PROVIDERS.has(id)
}
