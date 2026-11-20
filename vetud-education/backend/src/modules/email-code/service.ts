import type { AuthenticationInput, AuthenticationResponse, AuthIdentityDTO, AuthIdentityProviderService } from "@medusajs/framework/types"
import { AbstractAuthModuleProvider, MedusaError } from "@medusajs/framework/utils"
import { checkSignInCode, normalizeEmail, SIGN_IN_CODE_ERRORS, SIGN_IN_PROVIDER, type SignInCodeState } from "../../lib/sign-in-code"

/**
 * Signs a customer in with the 6-digit code emailed by POST /store/sign-in-code (owner, 2026-11-19).
 * POST /auth/customer/email-code with { email, code } returns Medusa's usual sign-in token. A login
 * that isn't a member yet gets a token without a customer; the storefront then creates the account
 * with that token (POST /store/customers), as with any first sign-in.
 */
class EmailCodeAuthProvider extends AbstractAuthModuleProvider {
  static identifier = SIGN_IN_PROVIDER
  static DISPLAY_NAME = "Email code"

  async authenticate(data: AuthenticationInput, logins: AuthIdentityProviderService): Promise<AuthenticationResponse> {
    const body = (data.body ?? {}) as { email?: unknown; code?: unknown }
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : ""
    const code = typeof body.code === "string" || typeof body.code === "number" ? String(body.code) : ""
    if (!email || !code) return { success: false, error: "Enter your email and the code we sent you." }

    let identity: AuthIdentityDTO
    try {
      identity = await logins.retrieve({ entity_id: email })
    } catch (error) {
      if ((error as MedusaError).type === MedusaError.Types.NOT_FOUND) return { success: false, error: SIGN_IN_CODE_ERRORS.expired }
      throw error
    }
    const login = identity.provider_identities?.find((provider) => provider.provider === SIGN_IN_PROVIDER)
    if (!login) return { success: false, error: SIGN_IN_CODE_ERRORS.expired }

    const state = (login.provider_metadata ?? {}) as SignInCodeState
    const result = checkSignInCode(state, login.id, code)
    if (result === "ok") {
      // A code works once.
      await logins.update(email, { provider_metadata: { ...state, code_hash: null, expires_at: null, attempts: 0 } })
      return {
        success: true,
        authIdentity: { ...identity, provider_identities: identity.provider_identities?.map((provider) => ({ ...provider, provider_metadata: {} })) },
      }
    }
    if (result === "wrong") await logins.update(email, { provider_metadata: { ...state, attempts: (state.attempts ?? 0) + 1 } })
    return { success: false, error: SIGN_IN_CODE_ERRORS[result] }
  }

  /** Accounts are made at the first sign-in with a code, not here. */
  async register(): Promise<AuthenticationResponse> {
    return { success: false, error: "Ask for a sign-in code: your account is created the first time you sign in." }
  }
}

export default EmailCodeAuthProvider
