"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { subscribedInBrowser } from "../newsletter/subscription"
import WelcomeSplash from "./WelcomeSplash"
import EntrySplash from "./EntrySplash"
import { entryVisitor, rememberEntryVisitor, type EntryVisitor } from "./entry-session"
import { dismissWelcomeForSession, startWelcomeForSession } from "./session"

// Pages opened from an email link, where a full-screen sign-up would get in the way.
const QUIET_PATHS = /^\/[^/]+\/(newsletter|account\/reset-password)(\/|$)/

/**
 * Offer the email list thirty seconds after entry and after each dismissal, until subscribed.
 * Check browser preferences before opening so navigation and reloads cannot flash the splash.
 */
export default function WelcomeExperience() {
  const pathname = usePathname()
  // null until read after hydration: the server can't know what this browser stored.
  const [subscribed, setSubscribed] = useState<boolean | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [thanking, setThanking] = useState(false)
  const [visitor, setVisitor] = useState<EntryVisitor | null | undefined>(undefined)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setCooldownUntil(value => Math.max(value, startWelcomeForSession()))
      setSubscribed(subscribedInBrowser())
      setVisitor(entryVisitor())
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

  const asking = subscribed === false && !QUIET_PATHS.test(pathname)
  // After signing up, the thank-you stays until it is closed, and the splash doesn't return.
  const open = !!visitor && cooldownUntil === 0 && (asking || thanking)

  return <>
    <EntrySplash open={visitor === null} onEnter={() => {
      const accepted = rememberEntryVisitor(true)
      if (!accepted) return
      // Let the visitor enter the actual site before offering the existing newsletter splash.
      setCooldownUntil(dismissWelcomeForSession())
      setVisitor(accepted)
    }} />
    <WelcomeSplash
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
  </>
}
