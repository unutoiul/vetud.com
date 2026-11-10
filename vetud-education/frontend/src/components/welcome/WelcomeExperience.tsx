"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { subscribedInBrowser } from "../newsletter/subscription"
import WelcomeSplash from "./WelcomeSplash"
import { dismissWelcomeForSession, welcomeDismissedInSession } from "./session"

// Pages opened from an email link, where a full-screen sign-up would get in the way.
const QUIET_PATHS = /^\/[^/]+\/(newsletter|account\/reset-password)(\/|$)/

/**
 * Offer the email list until dismissed for this tab's session or subscribed in this browser.
 * Check browser preferences before opening so navigation and reloads cannot flash the splash.
 */
export default function WelcomeExperience() {
  const pathname = usePathname()
  // null until read after hydration: the server can't know what this browser stored.
  const [subscribed, setSubscribed] = useState<boolean | null>(null)
  const [skipped, setSkipped] = useState(false)
  const [thanking, setThanking] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSkipped(value => value || welcomeDismissedInSession())
      setSubscribed(subscribedInBrowser())
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const asking = subscribed === false && !QUIET_PATHS.test(pathname)
  // After signing up, the thank-you stays until it is closed, and the splash doesn't return.
  const open = !skipped && (asking || thanking)

  return <WelcomeSplash
    open={open}
    onDismiss={() => {
      dismissWelcomeForSession()
      setSkipped(true)
      setThanking(false)
    }}
    onSubscribed={() => {
      dismissWelcomeForSession()
      setSubscribed(true)
      setThanking(true)
    }}
  />
}
