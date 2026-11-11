"use client"

import type { HttpTypes } from "@medusajs/types"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { CUSTOMER_TOKEN_KEY, sdk } from "@/lib/medusa/sdk"

const CUSTOMER_FIELDS = "id,email,first_name,last_name"

/**
 * Every sign-in is confirmed with a 6-digit code sent by email. Between the password and the code
 * the SDK holds a token with no member attached; this step remembers which challenge it belongs to.
 * It's kept for this tab, so switching to the mail app and back (or a reload) doesn't lose it.
 */
export type SignInCodeStep = { challengeId: string; sentTo: string }
const CODE_STEP_KEY = "vetud_sign_in_code"

function readCodeStep(): SignInCodeStep | null {
  try {
    const value = JSON.parse(window.sessionStorage.getItem(CODE_STEP_KEY) ?? "null") as Partial<SignInCodeStep> | null
    return typeof value?.challengeId === "string" && typeof value.sentTo === "string" ? { challengeId: value.challengeId, sentTo: value.sentTo } : null
  } catch {
    return null
  }
}

function writeCodeStep(step: SignInCodeStep | null) {
  try {
    if (step) window.sessionStorage.setItem(CODE_STEP_KEY, JSON.stringify(step))
    else window.sessionStorage.removeItem(CODE_STEP_KEY)
  } catch {
    // Without storage the step still works until the page is reloaded.
  }
}

/** Medusa's MFA messages, in plain words. */
function codeErrorMessage(error: unknown) {
  const message = errorMessage(error)
  if (/invalid mfa challenge code/i.test(message)) return "That code isn't right. Check the email and try again."
  if (/expired/i.test(message)) return "This code has expired. Please sign in again to get a new one."
  if (/too many/i.test(message)) return "Too many wrong codes. Please sign in again to get a new one."
  if (/already been completed/i.test(message)) return "This code has already been used. Please sign in again."
  if (/mfa verification is required|unauthori[sz]ed|not found/i.test(message)) return "Your sign-in has timed out. Please sign in again."
  return message
}

type MfaLoginResult = { mfa_required?: boolean; mfa_challenge?: { id?: string; methods?: string[] } }

type AccountContextValue = {
  customer: HttpTypes.StoreCustomer | null
  loading: boolean
  pending: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  /** Set after the password step until the emailed code is entered. */
  codeStep: SignInCodeStep | null
  verifyCode: (code: string) => Promise<void>
  resendCode: () => Promise<void>
  cancelCode: () => Promise<void>
  signUp: (details: { email: string; password: string; first_name: string; last_name: string }) => Promise<void>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string, language: string) => Promise<void>
  resetPassword: (password: string, token: string) => Promise<void>
  refreshCustomer: () => Promise<HttpTypes.StoreCustomer | null>
  captureSession: () => () => void
  clearError: () => void
}

const AccountContext = createContext<AccountContextValue | null>(null)

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message)
  }
  return "Something went wrong. Please try again."
}

function isToken(value: unknown): value is string {
  return typeof value === "string" && value.length > 0
}

export default function AccountProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<HttpTypes.StoreCustomer | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [codeStep, setCodeStepState] = useState<SignInCodeStep | null>(null)
  const authVersion = useRef(0)

  const setCodeStep = useCallback((step: SignInCodeStep | null) => {
    writeCodeStep(step)
    setCodeStepState(step)
  }, [])

  const refreshCustomer = useCallback(async () => {
    const version = authVersion.current
    try {
      const response = await sdk.store.customer.retrieve({ fields: CUSTOMER_FIELDS })
      if (version !== authVersion.current) return null
      setCustomer(response.customer)
      return response.customer
    } catch {
      if (version === authVersion.current) setCustomer(null)
      return null
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const version = authVersion.current
      const signedIn = await refreshCustomer()
      if (cancelled || version !== authVersion.current) return
      if (!signedIn) setCodeStepState(readCodeStep())
      else writeCodeStep(null)
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [refreshCustomer])

  // Signing in or out in another tab applies here too.
  useEffect(() => {
    const syncSession = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage || (event.key !== null && event.key !== CUSTOMER_TOKEN_KEY)) return
      authVersion.current += 1
      const version = authVersion.current
      setCustomer(null)
      setError(null)
      setPending(false)
      setCodeStep(null)
      setLoading(true)
      void refreshCustomer().then(() => {
        if (version === authVersion.current) setLoading(false)
      })
    }
    window.addEventListener("storage", syncSession)
    return () => window.removeEventListener("storage", syncSession)
  }, [refreshCustomer, setCodeStep])

  const captureSession = useCallback(() => {
    const version = authVersion.current
    return () => {
      if (version !== authVersion.current) throw new Error("Your account changed. Please try again.")
    }
  }, [])

  const run = useCallback(async <T,>(task: (assertCurrent: () => void) => Promise<T>) => {
    const version = authVersion.current
    const assertCurrent = captureSession()
    setPending(true)
    setError(null)
    try {
      return await task(assertCurrent)
    } catch (error) {
      if (version === authVersion.current) setError(errorMessage(error))
      throw error
    } finally {
      if (version === authVersion.current) setPending(false)
    }
  }, [captureSession])

  /** After the password step: email a code and wait for it. */
  const beginCodeStep = useCallback(async (result: unknown, assertCurrent: () => void) => {
    const { mfa_required, mfa_challenge } = (result ?? {}) as MfaLoginResult
    if (!mfa_required || !mfa_challenge?.id || !mfa_challenge.methods?.includes("email")) {
      throw new Error("This sign-in needs a step we can't show here. Please contact us.")
    }
    const { sent_to } = await sdk.client.fetch<{ sent_to: string }>("/store/sign-in-code", { method: "POST" })
    assertCurrent()
    setCodeStep({ challengeId: mfa_challenge.id, sentTo: sent_to })
  }, [setCodeStep])

  const signIn = useCallback(
    async (email: string, password: string) => {
      authVersion.current += 1
      await run(async (assertCurrent) => {
        setCodeStep(null)
        const result = await sdk.auth.login("customer", "emailpass", { email, password })
        assertCurrent()
        if (isToken(result)) await refreshCustomer()
        else await beginCodeStep(result, assertCurrent)
      })
    },
    [beginCodeStep, refreshCustomer, run, setCodeStep]
  )

  const signUp = useCallback(
    async ({ email, password, first_name, last_name }: Parameters<AccountContextValue["signUp"]>[0]) => {
      authVersion.current += 1
      await run(async (assertCurrent) => {
        await sdk.auth.register("customer", "emailpass", { email, password })
        assertCurrent()
        await sdk.store.customer.create({ email, first_name, last_name }, { fields: CUSTOMER_FIELDS })
        assertCurrent()
        const result = await sdk.auth.login("customer", "emailpass", { email, password })
        assertCurrent()
        if (isToken(result)) await refreshCustomer()
        else await beginCodeStep(result, assertCurrent)
      })
    },
    [beginCodeStep, refreshCustomer, run]
  )

  const verifyCode = useCallback(
    async (code: string) => {
      const step = codeStep
      if (!step) return
      authVersion.current += 1
      await run(async (assertCurrent) => {
        try {
          await sdk.auth.mfa.verifyChallenge(step.challengeId, { method: "email", code: code.replace(/\s/g, "") })
        } catch (error) {
          throw new Error(codeErrorMessage(error))
        }
        assertCurrent()
        setCodeStep(null)
        await refreshCustomer()
      })
    },
    [codeStep, refreshCustomer, run, setCodeStep]
  )

  const resendCode = useCallback(async () => {
    const step = codeStep
    if (!step) return
    await run(async (assertCurrent) => {
      try {
        const { sent_to } = await sdk.client.fetch<{ sent_to: string }>("/store/sign-in-code", { method: "POST" })
        assertCurrent()
        setCodeStep({ ...step, sentTo: sent_to })
      } catch (error) {
        throw new Error(codeErrorMessage(error))
      }
    })
  }, [codeStep, run, setCodeStep])

  /** Back to the sign-in form; the half-finished sign-in is dropped. */
  const cancelCode = useCallback(async () => {
    authVersion.current += 1
    setCodeStep(null)
    setError(null)
    try {
      await sdk.auth.logout()
    } catch {
      // The token is cleared either way.
    }
  }, [setCodeStep])

  const signOut = useCallback(async () => {
    authVersion.current += 1
    await run(async () => {
      await sdk.auth.logout()
      setCustomer(null)
      setCodeStep(null)
    })
  }, [run, setCodeStep])

  const requestPasswordReset = useCallback(
    async (email: string, language: string) => {
      await run(async () => {
        // Medusa answers the same way whether or not the account exists. The language
        // lets the emailed link open the site in the language the member was using.
        await sdk.auth.resetPassword("customer", "emailpass", { identifier: email, metadata: { language } })
      })
    },
    [run]
  )

  const resetPassword = useCallback(
    async (password: string, token: string) => {
      await run(async () => {
        await sdk.auth.updateProvider("customer", "emailpass", { password }, token)
      })
    },
    [run]
  )

  const value = useMemo<AccountContextValue>(
    () => ({
      customer,
      loading,
      pending,
      error,
      signIn,
      codeStep,
      verifyCode,
      resendCode,
      cancelCode,
      signUp,
      signOut,
      requestPasswordReset,
      resetPassword,
      refreshCustomer,
      captureSession,
      clearError: () => setError(null),
    }),
    [customer, loading, pending, error, signIn, codeStep, verifyCode, resendCode, cancelCode, signUp, signOut, requestPasswordReset, resetPassword, refreshCustomer, captureSession]
  )

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export function useAccount() {
  const context = useContext(AccountContext)
  if (!context) throw new Error("useAccount must be used inside <AccountProvider>")
  return context
}
