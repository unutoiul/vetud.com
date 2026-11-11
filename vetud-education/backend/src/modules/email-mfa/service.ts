import { MedusaError } from "@medusajs/framework/utils"
import type { AuthMfaProvider, AuthTypes, Context, DAL, ModulesSdkTypes } from "@medusajs/framework/types"
import {
  hashSignInCode,
  sameSignInCodeHash,
  SIGN_IN_CODE_MAX_ATTEMPTS,
  SIGN_IN_CODE_METHOD,
  SIGN_IN_CODE_RESEND_SECONDS,
  SIGN_IN_CODE_TTL_MINUTES,
} from "../../lib/sign-in-code"

type Factor = {
  id: string
  auth_identity_id: string
  status: AuthTypes.AuthMfaStatus
  provider_metadata?: Record<string, unknown> | null
}

/** What the factor keeps between sending a code and checking it. The code itself is never stored. */
type PendingCode = {
  code_hash?: string | null
  expires_at?: string | null
  attempts?: number
  sent_at?: string | null
}

type InjectedDependencies = {
  baseRepository: DAL.RepositoryService
  authMfaFactorService: ModulesSdkTypes.IMedusaInternalService<any>
}

type Options = { secret?: string }

/**
 * The `email` MFA method: a 6-digit code sent to the member's email after the password step.
 * Codes are made and emailed by the send-sign-in-code workflow, which passes only a keyed hash
 * here through `start`. This provider stores that hash and checks codes against it: single use,
 * 10 minutes, 5 tries.
 */
class EmailSignInCodeProvider implements AuthMfaProvider {
  static identifier = SIGN_IN_CODE_METHOD
  readonly method = SIGN_IN_CODE_METHOD

  protected readonly baseRepository_: DAL.RepositoryService
  protected readonly authMfaFactorService_: ModulesSdkTypes.IMedusaInternalService<any>
  protected readonly secret_?: string

  constructor({ baseRepository, authMfaFactorService }: InjectedDependencies, options: Options = {}) {
    this.baseRepository_ = baseRepository
    this.authMfaFactorService_ = authMfaFactorService
    this.secret_ = options.secret
  }

  private async factor_(authIdentityId: string, status: AuthTypes.AuthMfaStatus[], sharedContext?: Context): Promise<Factor | undefined> {
    const [factor] = await this.authMfaFactorService_.list({ auth_identity_id: authIdentityId, provider: this.method, status }, {}, sharedContext)
    return factor
  }

  private async serialize_(factor: Factor): Promise<AuthTypes.AuthMfaDTO> {
    const serialized = await this.baseRepository_.serialize<AuthTypes.AuthMfaDTO & { provider_metadata?: unknown }>(factor)
    delete serialized.provider_metadata
    return serialized
  }

  async canVerifyForAuthIdentity(data: { auth_identity_id: string }, sharedContext?: Context) {
    return Boolean(await this.factor_(data.auth_identity_id, ["enabled"], sharedContext))
  }

  /**
   * Turns the method on for the member. When the send workflow passes `metadata.code_hash` and
   * `metadata.expires_at`, it also stores a new code, at most once every 30 seconds.
   */
  async start(data: AuthTypes.AuthMfaStartDTO, sharedContext?: Context): Promise<AuthTypes.AuthMfaStartResponse> {
    let factor = await this.factor_(data.auth_identity_id, ["pending", "enabled"], sharedContext)
    if (!factor) {
      factor = await this.authMfaFactorService_.create({ auth_identity_id: data.auth_identity_id, provider: this.method, status: "enabled", provider_metadata: {} }, sharedContext)
    } else if (factor.status === "pending") {
      factor = await this.authMfaFactorService_.update({ id: factor.id, status: "enabled" }, sharedContext)
    }

    const codeHash = data.metadata?.code_hash
    const expiresAt = data.metadata?.expires_at
    if (typeof codeHash === "string" || typeof expiresAt === "string") {
      if (typeof codeHash !== "string" || !/^[0-9a-f]{64}$/.test(codeHash) || typeof expiresAt !== "string" || Number.isNaN(Date.parse(expiresAt))) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid sign-in code request")
      }
      const previous = (factor!.provider_metadata ?? {}) as PendingCode
      const sentAt = previous.sent_at ? Date.parse(previous.sent_at) : 0
      if (Date.now() - sentAt < SIGN_IN_CODE_RESEND_SECONDS * 1000) {
        throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Please wait a few seconds before asking for another code.")
      }
      // Never longer than the code's lifetime, whatever the caller asked for.
      const expires = Math.min(Date.parse(expiresAt), Date.now() + SIGN_IN_CODE_TTL_MINUTES * 60_000)
      const pending: PendingCode = { code_hash: codeHash, expires_at: new Date(expires).toISOString(), attempts: 0, sent_at: new Date().toISOString() }
      factor = await this.authMfaFactorService_.update({ id: factor!.id, provider_metadata: pending }, sharedContext)
    }
    return { mfa: await this.serialize_(factor!) }
  }

  async verifySetup(data: AuthTypes.AuthMfaVerifyDTO, sharedContext?: Context): Promise<AuthTypes.AuthMfaDTO> {
    const factor: Factor = await this.authMfaFactorService_.retrieve(data.id, {}, sharedContext)
    if (factor.status === "disabled") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This sign-in method is turned off")
    const enabled = factor.status === "pending" ? await this.authMfaFactorService_.update({ id: factor.id, status: "enabled" }, sharedContext) : factor
    return await this.serialize_(enabled)
  }

  /** True once for the latest code sent, within 10 minutes and 5 tries. */
  async verify(data: { auth_identity_id: string; code: string }, sharedContext?: Context) {
    if (!this.secret_) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Sign-in codes need the `secret` option")
    const factor = await this.factor_(data.auth_identity_id, ["enabled"], sharedContext)
    const pending = (factor?.provider_metadata ?? {}) as PendingCode
    if (!factor || !pending.code_hash || !pending.expires_at) return false
    if (Date.parse(pending.expires_at) <= Date.now() || (pending.attempts ?? 0) >= SIGN_IN_CODE_MAX_ATTEMPTS) return false

    const code = String(data.code ?? "").replace(/\s/g, "")
    const valid = /^\d{6}$/.test(code) && sameSignInCodeHash(hashSignInCode(this.secret_, data.auth_identity_id, code), pending.code_hash)
    const next: PendingCode = valid
      ? { ...pending, code_hash: null }
      : { ...pending, attempts: (pending.attempts ?? 0) + 1 }
    await this.authMfaFactorService_.update({ id: factor.id, provider_metadata: next }, sharedContext)
    return valid
  }
}

export default EmailSignInCodeProvider
