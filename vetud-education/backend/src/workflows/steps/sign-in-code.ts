import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { EmailTemplates } from "../../modules/resend/templates"
import { hashSignInCode, newSignInCode, SIGN_IN_CODE_METHOD, SIGN_IN_CODE_TTL_MINUTES } from "../../lib/sign-in-code"

/**
 * Before a member signs in with email and password, make sure their account asks for an emailed
 * code. Only member accounts are changed; Admin users keep their own sign-in.
 */
export const enableSignInCodeStep = createStep("enable-sign-in-code", async ({ email }: { email: string }, { container }) => {
  const auth = container.resolve(Modules.AUTH)
  const enabled: string[] = []
  for (const entityId of new Set([email.trim(), email.trim().toLowerCase()])) {
    const identities = await auth.listProviderIdentities({ provider: "emailpass", entity_id: entityId })
    for (const identity of identities) {
      if (!identity.auth_identity_id || enabled.includes(identity.auth_identity_id)) continue
      const authIdentity = await auth.retrieveAuthIdentity(identity.auth_identity_id)
      if (typeof authIdentity.app_metadata?.customer_id !== "string") continue
      const [factor] = await auth.listAuthMfa({ auth_identity_id: authIdentity.id, provider: SIGN_IN_CODE_METHOD, status: "enabled" })
      if (!factor) await auth.startAuthMfa({ auth_identity_id: authIdentity.id, provider: SIGN_IN_CODE_METHOD })
      enabled.push(authIdentity.id)
    }
  }
  return new StepResponse({ checked: enabled.length })
})

/**
 * Makes a new code, stores only its keyed hash with the `email` MFA provider, and emails the
 * code to the member's current address. Sending again within 30 seconds is refused.
 */
export const sendSignInCodeStep = createStep("send-sign-in-code", async ({ auth_identity_id }: { auth_identity_id: string }, { container }) => {
  const auth = container.resolve(Modules.AUTH)
  const { projectConfig } = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
  // The same JWT_SECRET the email MFA provider checks codes with (medusa-config.ts).
  const secret = projectConfig.http.jwtSecret?.toString()
  if (!secret) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "JWT_SECRET is not set")

  const identity = await auth.retrieveAuthIdentity(auth_identity_id, { relations: ["provider_identities"] })
  const customerId = identity.app_metadata?.customer_id
  if (typeof customerId !== "string") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Sign-in codes are for member accounts")

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: customers } = await query.graph({ entity: "customer", fields: ["email", "first_name"], filters: { id: customerId } })
  const email = customers[0]?.email ?? identity.provider_identities?.find((provider) => provider.provider === "emailpass")?.entity_id
  if (!email) throw new MedusaError(MedusaError.Types.NOT_FOUND, "This account has no email address")

  const code = newSignInCode()
  const expiresAt = new Date(Date.now() + SIGN_IN_CODE_TTL_MINUTES * 60_000).toISOString()
  await auth.startAuthMfa({
    auth_identity_id,
    provider: SIGN_IN_CODE_METHOD,
    metadata: { code_hash: hashSignInCode(secret, auth_identity_id, code), expires_at: expiresAt },
  })
  await container.resolve(Modules.NOTIFICATION).createNotifications({
    to: email,
    channel: "email",
    template: EmailTemplates.SIGN_IN_CODE,
    data: { code, minutes: SIGN_IN_CODE_TTL_MINUTES, first_name: customers[0]?.first_name ?? null },
  })
  return new StepResponse({ email })
})
