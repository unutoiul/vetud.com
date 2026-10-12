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
import type { CountryOption } from "@/lib/medusa/regions"

export const CART_FIELDS = [
  "*items",
  "*items.product",
  "+items.product.metadata",
  "*items.product.categories",
  "*items.variant",
  "*shipping_methods",
  "*shipping_address",
  "*billing_address",
  "*payment_collection",
  "*payment_collection.payment_sessions",
  "*region",
  "*region.countries",
].join(",")

const CART_STORAGE_KEY = "vetud_cart_id"

function readCartId() {
  try {
    return window.localStorage.getItem(CART_STORAGE_KEY)
  } catch {
    return null
  }
}

function writeCartId(id: string | null) {
  try {
    if (id) {
      window.localStorage.setItem(CART_STORAGE_KEY, id)
    } else {
      window.localStorage.removeItem(CART_STORAGE_KEY)
    }
  } catch {
    // Storage can be unavailable (private mode); the cart then lasts for this page view.
  }
}

export type RegionSummary = {
  id: string
  name: string
  currencyCode: string
  /** Cart total from which standard shipping is free (region metadata, set by the backend). */
  freeShippingThreshold?: number
}

type StoreContextValue = {
  countryCode: string
  region: RegionSummary
  countries: CountryOption[]
  cart: HttpTypes.StoreCart | null
  cartReady: boolean
  pending: boolean
  error: string | null
  itemCount: number
  drawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
  addItem: (variantId: string, quantity: number) => Promise<boolean>
  updateItem: (lineId: string, quantity: number) => Promise<void>
  removeItem: (lineId: string) => Promise<void>
  refreshCart: () => Promise<HttpTypes.StoreCart | null>
  setCart: (cart: HttpTypes.StoreCart | null) => void
  clearCart: () => void
  clearError: () => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message)
  }
  return "Something went wrong. Please try again."
}

type StoreProviderProps = {
  countryCode: string
  region: RegionSummary
  countries: CountryOption[]
  children: ReactNode
}

export default function StoreProvider({ countryCode, region, countries, children }: StoreProviderProps) {
  const [cart, setCartState] = useState<HttpTypes.StoreCart | null>(null)
  const [cartReady, setCartReady] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const cartRef = useRef<HttpTypes.StoreCart | null>(null)

  const setCart = useCallback((next: HttpTypes.StoreCart | null) => {
    cartRef.current = next
    setCartState(next)
    writeCartId(next?.id ?? null)
  }, [])

  const retrieve = useCallback(async (id: string) => {
    const { cart: fetched } = await sdk.store.cart.retrieve(id, { fields: CART_FIELDS })
    return fetched
  }, [])

  // Load the saved cart, dropping it if it was completed, and move it to the current region.
  useEffect(() => {
    let cancelled = false
    async function load() {
      const id = readCartId()
      if (!id) {
        setCartReady(true)
        return
      }
      try {
        let saved = await retrieve(id)
        if (saved.completed_at) {
          if (!cancelled) setCart(null)
          return
        }
        if (saved.region_id !== region.id) {
          const { cart: moved } = await sdk.store.cart.update(
            saved.id,
            { region_id: region.id },
            { fields: CART_FIELDS }
          )
          saved = moved
        }
        if (!cancelled) setCart(saved)
      } catch {
        if (!cancelled) setCart(null)
      } finally {
        if (!cancelled) setCartReady(true)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [region.id, retrieve, setCart])

  const run = useCallback(async <T,>(task: () => Promise<T>): Promise<T | undefined> => {
    setPending(true)
    setError(null)
    try {
      return await task()
    } catch (err) {
      setError(errorMessage(err))
      return undefined
    } finally {
      setPending(false)
    }
  }, [])

  const ensureCart = useCallback(async () => {
    if (cartRef.current) {
      return cartRef.current
    }
    const { cart: created } = await sdk.store.cart.create(
      { region_id: region.id },
      { fields: CART_FIELDS }
    )
    setCart(created)
    return created
  }, [region.id, setCart])

  const addItem = useCallback(
    async (variantId: string, quantity: number) => {
      const result = await run(async () => {
        const current = await ensureCart()
        const { cart: updated } = await sdk.store.cart.createLineItem(
          current.id,
          { variant_id: variantId, quantity },
          { fields: CART_FIELDS }
        )
        setCart(updated)
        setDrawerOpen(true)
        return true
      })
      return result === true
    },
    [ensureCart, run, setCart]
  )

  const updateItem = useCallback(
    async (lineId: string, quantity: number) => {
      await run(async () => {
        const current = cartRef.current
        if (!current) return
        const { cart: updated } = await sdk.store.cart.updateLineItem(
          current.id,
          lineId,
          { quantity },
          { fields: CART_FIELDS }
        )
        setCart(updated)
      })
    },
    [run, setCart]
  )

  const removeItem = useCallback(
    async (lineId: string) => {
      await run(async () => {
        const current = cartRef.current
        if (!current) return
        await sdk.store.cart.deleteLineItem(current.id, lineId)
        setCart(await retrieve(current.id))
      })
    },
    [retrieve, run, setCart]
  )

  const refreshCart = useCallback(async () => {
    const current = cartRef.current
    if (!current) return null
    const fresh = await retrieve(current.id)
    setCart(fresh)
    return fresh
  }, [retrieve, setCart])

  const value = useMemo<StoreContextValue>(
    () => ({
      countryCode,
      region,
      countries,
      cart,
      cartReady,
      pending,
      error,
      itemCount: (cart?.items ?? []).reduce((sum, item) => sum + Number(item.quantity), 0),
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      addItem,
      updateItem,
      removeItem,
      refreshCart,
      setCart,
      clearCart: () => setCart(null),
      clearError: () => setError(null),
    }),
    [countryCode, region, countries, cart, cartReady, pending, error, drawerOpen, addItem, updateItem, removeItem, refreshCart, setCart]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

/** Country segment of the current URL, or undefined outside the store layout. */
export function useCountryCode() {
  return useContext(StoreContext)?.countryCode
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error("useStore must be used inside <StoreProvider>")
  }
  return context
}
