import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { enableSignInCodeStep, sendSignInCodeStep } from "./steps/sign-in-code"

/** Runs before every email-and-password sign-in, so each member is asked for an emailed code. */
export const enableSignInCodeWorkflow = createWorkflow("enable-sign-in-code", function (input: { email: string }) {
  return new WorkflowResponse(enableSignInCodeStep(input))
})

/** Emails a new sign-in code to the member who just passed the password step. */
export const sendSignInCodeWorkflow = createWorkflow("send-sign-in-code", function (input: { auth_identity_id: string }) {
  return new WorkflowResponse(sendSignInCodeStep(input))
})
