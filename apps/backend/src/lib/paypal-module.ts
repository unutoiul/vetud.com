import type PayPalModule from "@easypayment/medusa-payment-paypal/modules/paypal"

export type PayPalModuleService = InstanceType<NonNullable<typeof PayPalModule.service>>
