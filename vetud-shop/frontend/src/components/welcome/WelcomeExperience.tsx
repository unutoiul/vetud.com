"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useAccount } from "../account/AccountProvider"
import { subscribedInBrowser } from "../newsletter/subscription"
import WelcomeSplash from "./WelcomeSplash"
import { dismissWelcomeForSession, welcomeCooldownUntil } from "./session"

// Pages where a full-screen sign-up would get in the way of a purchase, a payment return or an email link.
const QUIET_PATHS = /^\/[^/]+\/(cart|checkout|order|newsletter|account\/reset-password)(\/|$)/

/**
 * Offer the newsletter again five minutes after dismissal, until subscribed in this browser
 * (or, when signed in, have agreed to marketing email).
 * It replaces the timed offer pop-up, so visitors aren't asked twice on one page.
 */
export default function WelcomeExperience() {
  const pathname = usePathname()
  const { customer } = useAccount()
  // null until read after hydration: the server can't know what this browser stored.
  const [subscribed, setSubscribed] = useState<boolean | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [thanking, setThanking] = useState(false)
  const consented = customer?.metadata?.marketing_consent === true

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setCooldownUntil(value => Math.max(value, welcomeCooldownUntil()))
      setSubscribed(subscribedInBrowser())
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const refresh = () => {
      // Check again before reopening, including signups completed in another tab.
      setSubscribed(value => value === null ? null : value || subscribedInBrowser())
      setCooldownUntil(value => value > Date.now() ? value : 0)
    }
    const timer = cooldownUntil ? window.setTimeout(refresh, Math.max(0, cooldownUntil - Date.now())) : undefined
    window.addEventListener("focus", refresh)
    window.addEventListener("storage", refresh)
    document.addEventListener("visibilitychange", refresh)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener("focus", refresh)
      window.removeEventListener("storage", refresh)
      document.removeEventListener("visibilitychange", refresh)
    }
  }, [cooldownUntil])

  const asking = subscribed === false && !consented && !QUIET_PATHS.test(pathname)
  // After signing up, the thank-you stays until it is closed, and the splash doesn't return.
  const open = cooldownUntil === 0 && (asking || thanking)

  return <WelcomeSplash
    open={open}
    onDismiss={() => {
      setCooldownUntil(dismissWelcomeForSession())
      setThanking(false)
    }}
    onSubscribed={() => {
      dismissWelcomeForSession()
      setSubscribed(true)
      setThanking(true)
    }}
  />
}
