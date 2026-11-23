"use client"

import { Button, Flex, Grid } from "antd"
import { useEffect, useState } from "react"
import { DEFAULT_COUNTRY } from "@/config/markets"
import { ANALYTICS_ENABLED, OPEN_CONSENT_EVENT, europeanTimeZone, saveConsent, storedConsent, type Consent } from "@/lib/analytics"
import { colors } from "@/theme/tokens"
import { useCountry } from "./CountryProvider"
import { useMessages } from "./MessagesProvider"

/**
 * Asks visitors in Europe whether analytics may use cookies, once. It shows when the page has
 * European prices or the browser is on a European clock, and again whenever "Cookie settings" in
 * the footer is clicked. Nothing shows when no analytics ID is set.
 */
export default function CookieConsent() {
  const m = useMessages()
  const { country } = useCountry()
  const screens = Grid.useBreakpoint()
  const [open, setOpen] = useState(false)
  const [firstCountry] = useState(country)

  useEffect(() => {
    if (!ANALYTICS_ENABLED) return
    // Asking only visitors who haven't answered yet; the answer is kept in this browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!storedConsent() && (firstCountry !== DEFAULT_COUNTRY || europeanTimeZone())) setOpen(true)
    const reopen = () => setOpen(true)
    window.addEventListener(OPEN_CONSENT_EVENT, reopen)
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen)
  }, [firstCountry])

  if (!open) return null

  const answer = (choice: Consent) => {
    saveConsent(choice)
    setOpen(false)
  }

  // Phones: full width above the chat button. Wider screens: a card in the bottom-left corner.
  const wide = Boolean(screens.sm)
  return (
    <section
      role="region"
      aria-label={m.consent.label}
      style={{
        position: "fixed",
        zIndex: 900,
        insetInlineStart: wide ? 20 : 12,
        insetInlineEnd: wide ? "auto" : 12,
        insetBlockEnd: wide ? 20 : 72,
        maxWidth: wide ? 380 : undefined,
        background: colors.white,
        border: `1px solid ${colors.line}`,
        borderRadius: 14,
        boxShadow: `0 12px 32px ${colors.shadowStrong}`,
        padding: "16px 18px",
        color: colors.navyInk,
      }}
    >
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55 }}>{m.consent.text}</p>
      <Flex gap={8} style={{ marginTop: 14 }}>
        <Button type="primary" onClick={() => answer("granted")} style={{ flex: 1 }}>
          {m.consent.accept}
        </Button>
        <Button onClick={() => answer("denied")} style={{ flex: 1 }}>
          {m.consent.decline}
        </Button>
      </Flex>
    </section>
  )
}

/** For the footer: shows the choice again. */
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))
}
