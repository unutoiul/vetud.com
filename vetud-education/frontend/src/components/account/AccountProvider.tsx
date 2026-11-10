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

type AccountContextValue = {
  customer: HttpTypes.StoreCustomer | null
  loading: boolean
  pending: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
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
  const authVersion = useRef(0)

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
      await refreshCustomer()
      if (!cancelled && version === authVersion.current) setLoading(false)
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

  const signIn = useCallback(
    async (email: string, password: string) => {
      authVersion.current += 1
      await run(async (assertCurrent) => {
        const result = await sdk.auth.login("customer", "emailpass", { email, password })
        assertCurrent()
        if (!isToken(result)) throw new Error("This sign-in needs an additional verification step. Please contact support.")
        await refreshCustomer()
      })
    },
    [refreshCustomer, run]
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
        if (!isToken(result)) throw new Error("Your account was created, but sign-in needs an additional step. Please contact support.")
        await refreshCustomer()
      })
    },
    [refreshCustomer, run]
  )

  const signOut = useCallback(async () => {
    authVersion.current += 1
    await run(async () => {
      await sdk.auth.logout()
      setCustomer(null)
    })
  }, [run])

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
      signUp,
      signOut,
      requestPasswordReset,
      resetPassword,
      refreshCustomer,
      captureSession,
      clearError: () => setError(null),
    }),
    [customer, loading, pending, error, signIn, signUp, signOut, requestPasswordReset, resetPassword, refreshCustomer, captureSession]
  )

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export function useAccount() {
  const context = useContext(AccountContext)
  if (!context) throw new Error("useAccount must be used inside <AccountProvider>")
  return context
}
