"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { COUNTRY_COOKIE, DEFAULT_COUNTRY, type CountryCode } from "@/config/markets"
import type { ProductId, Strength } from "@/config/site"
import { currencyOf, formatPrice, lowestPrice, priceOf, pricePerMg } from "@/lib/pricing"

type CountryContextValue = {
  country: CountryCode
  currency: string
  setCountry: (code: CountryCode) => void
  /** The helpers below are lib/pricing.ts bound to the visitor's country. */
  priceOf: (product: ProductId, strength: Strength) => { regular: number; sale: number }
  pricePerMg: (product: ProductId, strength: Strength) => number
  lowestPrice: () => number
  money: (amount: number) => string
}

const bind = (country: CountryCode) => ({
  country,
  currency: currencyOf(country),
  priceOf: (product: ProductId, strength: Strength) => priceOf(product, strength, country),
  pricePerMg: (product: ProductId, strength: Strength) => pricePerMg(product, strength, country),
  lowestPrice: () => lowestPrice(country),
  money: (amount: number) => formatPrice(amount, country),
})

const CountryContext = createContext<CountryContextValue>({ ...bind(DEFAULT_COUNTRY), setCountry: () => {} })

/**
 * The visitor's country, which sets every price on the page. The server picks the first one (the
 * proxy, from a saved choice or where the visit comes from); the header picker and the order form's
 * shipping country change it on the spot and remember it for the next visit.
 */
export function CountryProvider({ country: initial, children }: { country: CountryCode; children: React.ReactNode }) {
  const [country, setCountryState] = useState<CountryCode>(initial)

  const setCountry = useCallback((code: CountryCode) => {
    setCountryState(code)
    const secure = window.location.protocol === "https:" ? "; Secure" : ""
    document.cookie = `${COUNTRY_COOKIE}=${code}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`
  }, [])

  const value = useMemo(() => ({ ...bind(country), setCountry }), [country, setCountry])

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>
}

export const useCountry = () => useContext(CountryContext)
