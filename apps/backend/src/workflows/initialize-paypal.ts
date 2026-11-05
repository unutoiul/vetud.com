import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import type { PayPalModuleService } from "../lib/paypal-module"

const initializePaypalWalletStep = createStep("initialize-paypal-wallet", async (_input: undefined, { container }) => {
  const paypal = container.resolve<PayPalModuleService>("paypal_onboarding")
  const { data } = await paypal.getSettings()
  // Fill only missing defaults. Future deploys must retain the merchant's Admin settings.
  const patch = {
    advanced_card_payments: { enabled: data?.advanced_card_payments?.enabled ?? false },
    additional_settings: {
      brandName: data?.additional_settings?.brandName || "Vetud",
      paymentAction: data?.additional_settings?.paymentAction || "capture",
    },
  }
  await paypal.saveSettings(patch)
  return new StepResponse({ initialized: true })
})

export const initializePaypalWalletWorkflow = createWorkflow("initialize-paypal-wallet", () => new WorkflowResponse(initializePaypalWalletStep()))
