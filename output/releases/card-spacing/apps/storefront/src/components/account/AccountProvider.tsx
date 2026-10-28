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
  "id,email,first_name,last_name,phone,company_name,default_shipping_address_id,default_billing_address_id,*addresses"

export type AccountAddress = HttpTypes.StoreCustomerAddress

type AccountContextValue = {
  customer: HttpTypes.StoreCustomer | null
  loading: boolean
  pending: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (details: {
    email: string
    password: string
    first_name: string
    last_name: string
    phone?: string
  }) => Promise<void>
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

  const signIn = useCallback(
    async (email: string, password: string) => {
      authVersion.current += 1
      await run(async (assertCurrent) => {
        const result = await sdk.auth.login("customer", "emailpass", { email, password })
        assertCurrent()
        if (!isToken(result)) {
          throw new Error("This sign-in needs an additional verification step. Please contact support.")
        }
        await refreshCustomer()
      })
    },
    [refreshCustomer, run]
  )

  const signUp = useCallback(
    async ({ email, password, first_name, last_name, phone }: Parameters<AccountContextValue["signUp"]>[0]) => {
      authVersion.current += 1
      await run(async (assertCurrent) => {
        await sdk.auth.register("customer", "emailpass", { email, password })
        assertCurrent()
        await sdk.store.customer.create(
          { email, first_name, last_name, phone: phone || undefined },
          { fields: CUSTOMER_FIELDS }
        )
        assertCurrent()
        const result = await sdk.auth.login("customer", "emailpass", { email, password })
        assertCurrent()
        if (!isToken(result)) {
          throw new Error("Your account was created, but sign-in needs an additional step. Please contact support.")
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
      signIn,
      signUp,
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
      signIn,
      signUp,
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
