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
import { sdk } from "@/lib/medusa/sdk"
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
      const result = await refreshCustomer()
      if (!cancelled) setLoading(false)
      return result
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [refreshCustomer])

  const run = useCallback(async <T,>(task: () => Promise<T>) => {
    setPending(true)
    setError(null)
    try {
      return await task()
    } catch (error) {
      setError(errorMessage(error))
      throw error
    } finally {
      setPending(false)
    }
  }, [])

  const signIn = useCallback(
    async (email: string, password: string) => {
      await run(async () => {
        authVersion.current += 1
        const result = await sdk.auth.login("customer", "emailpass", { email, password })
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
      await run(async () => {
        authVersion.current += 1
        await sdk.auth.register("customer", "emailpass", { email, password })
        await sdk.store.customer.create(
          { email, first_name, last_name, phone: phone || undefined },
          { fields: CUSTOMER_FIELDS }
        )
        const result = await sdk.auth.login("customer", "emailpass", { email, password })
        if (!isToken(result)) {
          throw new Error("Your account was created, but sign-in needs an additional step. Please contact support.")
        }
        await refreshCustomer()
      })
    },
    [refreshCustomer, run]
  )

  const signOut = useCallback(async () => {
    await run(async () => {
      authVersion.current += 1
      await sdk.auth.logout()
      setCustomer(null)
      // Remove the previous shopper's delivery details from this browser's cart.
      // Order history is component-local and unmounts at the same time.
      clearCart()
    })
  }, [clearCart, run])

  const updateProfile = useCallback(
    async (details: HttpTypes.StoreUpdateCustomer) => {
      await run(async () => {
        const response = await sdk.store.customer.update(details, { fields: CUSTOMER_FIELDS })
        setCustomer(response.customer)
      })
    },
    [run]
  )

  const createAddress = useCallback(
    async (address: HttpTypes.StoreCreateCustomerAddress) => {
      await run(async () => {
        const response = await sdk.store.customer.createAddress(address, { fields: CUSTOMER_FIELDS })
        setCustomer(response.customer)
      })
    },
    [run]
  )

  const updateAddress = useCallback(
    async (id: string, address: HttpTypes.StoreUpdateCustomerAddress) => {
      await run(async () => {
        const response = await sdk.store.customer.updateAddress(id, address, { fields: CUSTOMER_FIELDS })
        setCustomer(response.customer)
      })
    },
    [run]
  )

  const deleteAddress = useCallback(
    async (id: string) => {
      await run(async () => {
        const response = await sdk.store.customer.deleteAddress(id)
        setCustomer(response.parent ?? null)
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
      updateProfile,
      createAddress,
      updateAddress,
      deleteAddress,
      refreshCustomer,
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
    ]
  )

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export function useAccount() {
  const context = useContext(AccountContext)
  if (!context) throw new Error("useAccount must be used inside <AccountProvider>")
  return context
}
