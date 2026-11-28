"use client"

import type { HttpTypes } from "@medusajs/types"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { CUSTOMER_TOKEN_KEY, sdk } from "@/lib/medusa/sdk"

const CUSTOMER_FIELDS = "id,email,first_name,last_name"

type AccountContextValue = {
  customer: HttpTypes.StoreCustomer | null
  loading: boolean
  pending: boolean
  error: string | null
  /**
   * Emails a 6-digit sign-in code. `sent` is false when one went out less than 30 seconds ago;
   * `resendAfter` is the wait, in seconds, before another can be sent.
   */
  requestCode: (email: string) => Promise<{ sent: boolean; resendAfter: number }>
  /** Signs in with the emailed code (for 30 days). The first sign-in creates the account. */
  verifyCode: (email: string, code: string) => Promise<void>
  signOut: () => Promise<void>
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

function hasStoredToken() {
  try {
    return isToken(window.localStorage.getItem(CUSTOMER_TOKEN_KEY))
  } catch {
    // Storage blocked: ask the server, as before.
    return true
  }
}

/** A sign-in token names the member once the account exists; a first sign-in's token doesn't. */
function tokenHasCustomer(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))
    return typeof payload.actor_id === "string" && payload.actor_id.length > 0
  } catch {
    return false
  }
}

export default function AccountProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<HttpTypes.StoreCustomer | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const authVersion = useRef(0)

  const refreshCustomer = useCallback(async () => {
    const version = authVersion.current
    // Signed-out visitors have no token: asking the server anyway only logs a 401 in the console.
    if (!hasStoredToken()) {
      setCustomer(null)
      return null
    }
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
      await refreshCustomer()
      if (cancelled || version !== authVersion.current) return
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
      setLoading(true)
      void refreshCustomer().then(() => {
        if (version === authVersion.current) setLoading(false)
      })
    }
    window.addEventListener("storage", syncSession)
    return () => window.removeEventListener("storage", syncSession)
  }, [refreshCustomer])

  const captureSession = useCallback(() => {
    const version = authVersion.current
    return () => {
      if (version !== authVersion.current) throw new Error("Your account changed. Please try again.")
    }
  }, [])

  const run = useCallback(
    async <T,>(task: (assertCurrent: () => void) => Promise<T>) => {
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
    },
    [captureSession],
  )

  // Members have no passwords (owner, 2026-11-19): an emailed code signs them in for 30 days.
  const requestCode = useCallback(
    (email: string) =>
      run(async () => {
        const { sent, resend_after } = await sdk.client.fetch<{ sent: boolean; resend_after: number }>(
          "/store/sign-in-code",
          {
            method: "POST",
            body: { email: email.trim() },
          },
        )
        return { sent, resendAfter: resend_after }
      }),
    [run],
  )

  const verifyCode = useCallback(
    async (email: string, code: string) => {
      authVersion.current += 1
      await run(async (assertCurrent) => {
        const result = await sdk.auth.login("customer", "email-code", {
          email: email.trim(),
          code: code.replace(/\D/g, ""),
        })
        assertCurrent()
        if (!isToken(result)) throw new Error("This sign-in needs another step. Please contact us.")
        // The first sign-in makes the account; the refreshed token then carries it.
        if (!tokenHasCustomer(result)) {
          await sdk.store.customer.create({ email: email.trim() }, { fields: CUSTOMER_FIELDS })
          assertCurrent()
          await sdk.auth.refresh()
          assertCurrent()
        }
        await refreshCustomer()
      })
    },
    [refreshCustomer, run],
  )

  const signOut = useCallback(async () => {
    authVersion.current += 1
    await run(async () => {
      await sdk.auth.logout()
      setCustomer(null)
    })
  }, [run])

  const value = useMemo<AccountContextValue>(
    () => ({
      customer,
      loading,
      pending,
      error,
      requestCode,
      verifyCode,
      signOut,
      refreshCustomer,
      captureSession,
      clearError: () => setError(null),
    }),
    [customer, loading, pending, error, requestCode, verifyCode, signOut, refreshCustomer, captureSession],
  )

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export function useAccount() {
  const context = useContext(AccountContext)
  if (!context) throw new Error("useAccount must be used inside <AccountProvider>")
  return context
}
