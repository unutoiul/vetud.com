"use client"

import { useEffect } from "react"
import { MARKETS } from "@/config/markets"
import { useCountry } from "./CountryProvider"

/**
 * Marks the page with the current country's language. The root <html lang> is shared by every
 * country page, so the server sets it on this wrapper, and once the page runs it also goes on <html>
 * (pop-ups render outside the wrapper) and follows the country picker.
 */
export default function LangScope({ children }: { children: React.ReactNode }) {
  const { country } = useCountry()
  const lang = MARKETS[country].locale
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  return (
    <div lang={lang} style={{ display: "contents" }}>
      {children}
    </div>
  )
}
