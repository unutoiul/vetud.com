"use client"

import dynamic from "next/dynamic"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { ProductId, Strength } from "@/config/site"

const OrderModal = dynamic(() => import("./OrderModal"), { ssr: false })
const PromoModal = dynamic(() => import("./PromoModal"), { ssr: false })

type Selection = { product: ProductId; strength: Strength }
type OrderContextValue = {
  openOrder: (selection?: Partial<Selection>) => void
  openPromo: () => void
  /** The subscriber code once this visitor has it; filled into the order form. */
  promoCode: string | null
  savePromoCode: (code: string) => void
}

const OrderContext = createContext<OrderContextValue>({
  openOrder: () => {},
  openPromo: () => {},
  promoCode: null,
  savePromoCode: () => {},
})

const CODE_KEY = "vetud-pens:promo-code"
const SEEN_KEY = "vetud-pens:promo-seen"
/** The pop-up opens by itself once every three days at most. */
const SEEN_FOR_MS = 3 * 24 * 60 * 60 * 1000
const AUTO_OPEN_AFTER_MS = 12_000

const read = (key: string) => {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}
const write = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Private mode or blocked storage: the page still works, it just forgets.
  }
}

/**
 * Lets any "Buy now" button open the one order form with a pen chosen, and runs the "extra 10%"
 * pop-up: it opens by itself after a few seconds or when the mouse leaves the page, at most once
 * every three days, and never over the order form.
 */
export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orderOpen, setOrderOpen] = useState(false)
  const [orderLoaded, setOrderLoaded] = useState(false)
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoLoaded, setPromoLoaded] = useState(false)
  const [promoCode, setPromoCode] = useState<string | null>(null)
  const [selection, setSelection] = useState<Selection>({ product: "retatrutide", strength: "40mg" })
  const orderOpenRef = useRef(false)

  const openOrder = useCallback((next?: Partial<Selection>) => {
    if (next) setSelection((current) => ({ ...current, ...next }))
    setOrderLoaded(true)
    setOrderOpen(true)
    orderOpenRef.current = true
  }, [])

  const openPromo = useCallback(() => {
    setPromoLoaded(true)
    setPromoOpen(true)
    write(SEEN_KEY, String(Date.now()))
  }, [])

  const savePromoCode = useCallback((code: string) => {
    setPromoCode(code)
    write(CODE_KEY, code)
  }, [])

  useEffect(() => {
    const saved = read(CODE_KEY)
    // Restoring a value saved in this browser on an earlier visit.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setPromoCode(saved)
    const seen = Number(read(SEEN_KEY) || 0)
    if (saved || Date.now() - seen < SEEN_FOR_MS) return

    let done = false
    const show = () => {
      if (done || orderOpenRef.current) return
      done = true
      openPromo()
      cleanup()
    }
    const onLeave = (event: MouseEvent) => {
      if (event.clientY <= 0) show()
    }
    const timer = window.setTimeout(show, AUTO_OPEN_AFTER_MS)
    document.addEventListener("mouseout", onLeave)
    const cleanup = () => {
      window.clearTimeout(timer)
      document.removeEventListener("mouseout", onLeave)
    }
    return cleanup
  }, [openPromo])

  const value = useMemo(
    () => ({ openOrder, openPromo, promoCode, savePromoCode }),
    [openOrder, openPromo, promoCode, savePromoCode],
  )

  return (
    <OrderContext.Provider value={value}>
      {children}
      {orderLoaded && (
        <OrderModal
          open={orderOpen}
          initial={selection}
          onClose={() => {
            setOrderOpen(false)
            orderOpenRef.current = false
          }}
        />
      )}
      {promoLoaded && <PromoModal open={promoOpen} onClose={() => setPromoOpen(false)} />}
    </OrderContext.Provider>
  )
}

export const useOrder = () => useContext(OrderContext)
