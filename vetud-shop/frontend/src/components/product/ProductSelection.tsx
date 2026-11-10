"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type ProductSelection = { format?: string; setFormat: (format: string | undefined) => void }

const ProductSelectionContext = createContext<ProductSelection | null>(null)

/** Shares the chosen format between the purchase panel and the gallery, so the photo follows it. */
export function ProductSelectionProvider({ initialFormat, children }: { initialFormat?: string; children: ReactNode }) {
  const [format, setFormat] = useState(initialFormat)
  return <ProductSelectionContext.Provider value={{ format, setFormat }}>{children}</ProductSelectionContext.Provider>
}

/** Outside a provider (e.g. in previews) the selection is simply not shared. */
export function useProductSelection(): ProductSelection {
  return useContext(ProductSelectionContext) ?? { format: undefined, setFormat: () => {} }
}
