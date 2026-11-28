"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { CountryCode } from "@/config/markets"
import { loadMessages, type Messages } from "@/i18n"
import { useCountry } from "./CountryProvider"

const MessagesContext = createContext<Messages | null>(null)

/**
 * The page text for the visitor's country. The server sends the first country's text with the page;
 * when the visitor picks another country in the header (or ships elsewhere in the order form), that
 * country's file loads and every section switches to it.
 */
export function MessagesProvider({
  country,
  messages,
  children,
}: {
  country: CountryCode
  messages: Messages
  children: ReactNode
}) {
  const { country: current } = useCountry()
  const [loaded, setLoaded] = useState<{ country: CountryCode; messages: Messages }>({ country, messages })

  useEffect(() => {
    if (current === loaded.country) return
    let cancelled = false
    loadMessages(current)
      .then((next) => {
        if (!cancelled) setLoaded({ country: current, messages: next })
      })
      .catch(() => {
        // Keep showing the current text if a file can't load (offline); prices still switch.
      })
    return () => {
      cancelled = true
    }
  }, [current, loaded.country])

  return <MessagesContext.Provider value={loaded.messages}>{children}</MessagesContext.Provider>
}

/** The visitor's country's text (src/i18n/messages/<country>.json). */
export function useMessages(): Messages {
  const messages = useContext(MessagesContext)
  if (!messages) throw new Error("useMessages needs a MessagesProvider (see Storefront)")
  return messages
}
