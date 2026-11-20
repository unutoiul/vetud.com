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
import { useStore } from "../store/StoreProvider"

const CUSTOMER_FIELDS =
  "id,email,first_name,last_name,phone,company_name,default_shipping_address_id,metadata,*addresses"

export type AccountAddress = HttpTypes.StoreCustomerAddress

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
  updateProfile: (details: HttpTypes.StoreUpdateCustomer) => Promise<void>
  createAddress: (address: HttpTypes.StoreCreateCustomerAddress) => Promise<void>
  updateAddress: (id: string, address: HttpTypes.StoreUpdateCustomerAddress) => Promise<void>
  deleteAddress: (id: string) => Promise<void>
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

/** A sign-in token names the customer once the account exists; a first sign-in's token doesn't. */
function tokenHasCustomer(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))
    return typeof payload.actor_id === "string" && payload.actor_id.length > 0
  } catch {
    return false
  }
}

export default function AccountProvider({ children }: { children: ReactNode }) {
  const { clearCart } = useStore()
  const [customer, setCustomer] = useState<HttpTypes.StoreCustomer | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const authVersion = useRef(0)
  const authenticatedCustomerId = useRef<string | null>(null)

  const refreshCustomer = useCallback(async () => {
    const version = authVersion.current
    try {
      const response = await sdk.store.customer.retrieve({ fields: CUSTOMER_FIELDS })
      if (version !== authVersion.current) return null
      authenticatedCustomerId.current = response.customer.id
      setCustomer(response.customer)
      return response.customer
    } catch {
      if (version === authVersion.current) {
        authenticatedCustomerId.current = null
        setCustomer(null)
      }
      return null
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const version = authVersion.current
      const result = await refreshCustomer()
      if (!cancelled && version === authVersion.current) setLoading(false)
      return result
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [refreshCustomer])

  useEffect(() => {
    const syncSession = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage || (event.key !== null && event.key !== CUSTOMER_TOKEN_KEY)) return
      const previousCustomerId = authenticatedCustomerId.current
      authVersion.current += 1
      const version = authVersion.current
      setCustomer(null)
      setError(null)
      setPending(false)
      if (!event.newValue) clearCart()
      setLoading(true)
      void refreshCustomer().then((next) => {
        if (version !== authVersion.current) return
        // A guest signing in (or the same account refreshing its token) must
        // keep their basket. Only discard a previous account's private cart.
        if (previousCustomerId && previousCustomerId !== next?.id) clearCart()
        setLoading(false)
      })
    }
    window.addEventListener("storage", syncSession)
    return () => window.removeEventListener("storage", syncSession)
  }, [clearCart, refreshCustomer])

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

  // Customers have no passwords (owner, 2026-11-19): an emailed code signs them in for 30 days.
  const requestCode = useCallback(
    (email: string) =>
      run(async () => {
        const { sent, resend_after } = await sdk.client.fetch<{ sent: boolean; resend_after: number }>("/store/sign-in-code", {
          method: "POST",
          body: { email: email.trim() },
        })
        return { sent, resendAfter: resend_after }
      }),
    [run]
  )

  const verifyCode = useCallback(
    async (email: string, code: string) => {
      authVersion.current += 1
      await run(async (assertCurrent) => {
        const result = await sdk.auth.login("customer", "email-code", { email: email.trim(), code: code.replace(/D/g, "") })
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
    [refreshCustomer, run]
  )

  const signOut = useCallback(async () => {
    authVersion.current += 1
    await run(async () => {
      await sdk.auth.logout()
      authenticatedCustomerId.current = null
      setCustomer(null)
      // Remove the previous shopper's delivery details from this browser's cart.
      // Order history is component-local and unmounts at the same time.
      clearCart()
    })
  }, [clearCart, run])

  const updateProfile = useCallback(
    async (details: HttpTypes.StoreUpdateCustomer) => {
      await run(async (assertCurrent) => {
        const response = await sdk.store.customer.update(details, { fields: CUSTOMER_FIELDS })
        assertCurrent()
        setCustomer(response.customer)
      })
    },
    [run]
  )

  const createAddress = useCallback(
    async (address: HttpTypes.StoreCreateCustomerAddress) => {
      await run(async (assertCurrent) => {
        const response = await sdk.store.customer.createAddress(address, { fields: CUSTOMER_FIELDS })
        assertCurrent()
        setCustomer(response.customer)
      })
    },
    [run]
  )

  const updateAddress = useCallback(
    async (id: string, address: HttpTypes.StoreUpdateCustomerAddress) => {
      await run(async (assertCurrent) => {
        const response = await sdk.store.customer.updateAddress(id, address, { fields: CUSTOMER_FIELDS })
        assertCurrent()
        setCustomer(response.customer)
      })
    },
    [run]
  )

  const deleteAddress = useCallback(
    async (id: string) => {
      await run(async (assertCurrent) => {
        const response = await sdk.store.customer.deleteAddress(id)
        assertCurrent()
        if (response.parent) setCustomer(response.parent)
        else await refreshCustomer()
      })
    },
    [run, refreshCustomer]
  )

  const value = useMemo<AccountContextValue>(
    () => ({
      customer,
      loading,
      pending,
      error,
      requestCode,
      verifyCode,
      signOut,
      updateProfile,
      createAddress,
      updateAddress,
      deleteAddress,
      refreshCustomer,
      captureSession,
      clearError: () => setError(null),
    }),
    [
      customer,
      loading,
      pending,
      error,
      requestCode,
      verifyCode,
      signOut,
      updateProfile,
      createAddress,
      updateAddress,
      deleteAddress,
      refreshCustomer,
      captureSession,
    ]
  )

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export function useAccount() {
  const context = useContext(AccountContext)
  if (!context) throw new Error("useAccount must be used inside <AccountProvider>")
  return context
}
