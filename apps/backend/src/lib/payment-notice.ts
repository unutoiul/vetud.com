import { NMI_PROVIDER_ID } from "./nmi-config"

type Collection = { payments?: ({ provider_id?: string; data?: Record<string, unknown> | null; captured_at?: string | Date | null } | null)[] | null }

export function paymentNotice(collections?: (Collection | null)[] | null) {
  const payments = collections?.flatMap((collection) => collection?.payments ?? []).filter((payment) => payment !== null) ?? []
  const nmi = payments.find((payment) => payment.provider_id === NMI_PROVIDER_ID)
  if (nmi?.data?.payment_method === "ach") {
    return {
      manual_payment: false,
      payment_summary: "Your bank debit was submitted and is awaiting settlement. You do not need to make another transfer. We will hold your order until settlement is confirmed.",
      admin_payment_action: "NMI ACH: do not click Capture. Fulfillment is held until a verified settlement webhook arrives. A return or late return requires review.",
    }
  }
  if (nmi) {
    return {
      manual_payment: false,
      payment_summary: nmi.captured_at ? "Your card payment has been captured. No further payment is needed." : "Your card payment has been authorized. We will capture the payment when your order is ready to ship. No bank transfer is needed.",
      admin_payment_action: "NMI card: capture the full authorization in Medusa when ready to dispatch, then mark the shipment shipped. Do not request a bank transfer. Partial captures are not supported.",
    }
  }
  if (payments.some((payment) => payment.provider_id && payment.provider_id !== "pp_system_default")) {
    return { manual_payment: false, payment_summary: "Your order uses online checkout. Complete any remaining payment steps with your selected provider. We will ship after payment is confirmed.", admin_payment_action: "Verify the online payment has completed before shipping. Do not request an additional bank transfer." }
  }
  return { manual_payment: true, payment_summary: "We have received your order and reserved the stock. It ships after your bank transfer is confirmed.", admin_payment_action: "The customer has been emailed payment instructions. Mark the payment as captured in Medusa Admin once the transfer arrives, then create the fulfillment." }
}
