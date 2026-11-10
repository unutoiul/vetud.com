"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { subscribedInBrowser } from "../newsletter/subscription"
import WelcomeSplash from "./WelcomeSplash"

// Pages opened from an email link, where a full-screen sign-up would get in the way.
const QUIET_PATHS = /^\/[^/]+\/(newsletter|account\/reset-password)(\/|$)/

/**
 * The email-list splash opens on every page a visitor goes to until they sign up in this browser.
 * Skipping it closes it for this page only.
 */
export default function WelcomeExperience() {
  const pathname = usePathname()
  // null until read after hydration: the server can't know what this browser stored.
  const [subscribed, setSubscribed] = useState<boolean | null>(null)
  const [page, setPage] = useState(pathname)
  const [skipped, setSkipped] = useState(false)
  const [thanking, setThanking] = useState(false)

  // Each new page asks again.
  if (page !== pathname) {
    setPage(pathname)
    setSkipped(false)
    setThanking(false)
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setSubscribed(subscribedInBrowser()))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const asking = subscribed === false && !QUIET_PATHS.test(pathname)
  // After signing up, the thank-you stays until it is closed, and the splash doesn't return.
  const open = !skipped && (asking || thanking)

  return <WelcomeSplash
    open={open}
    onDismiss={() => setSkipped(true)}
    onSubscribed={() => {
      setSubscribed(true)
      setThanking(true)
    }}
  />
}
