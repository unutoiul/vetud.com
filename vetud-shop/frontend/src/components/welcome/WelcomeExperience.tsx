"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useAccount } from "../account/AccountProvider"
import { subscribedInBrowser } from "../newsletter/subscription"
import WelcomeSplash from "./WelcomeSplash"

// Pages where a full-screen sign-up would get in the way of a purchase, a payment return or an email link.
const QUIET_PATHS = /^\/[^/]+\/(cart|checkout|order|newsletter|account\/reset-password)(\/|$)/

/**
 * The newsletter splash opens on every page a visitor goes to until they subscribe in this browser
 * (or, when signed in, have agreed to marketing email). Skipping it closes it for this page only.
 * It replaces the timed offer pop-up, so visitors aren't asked twice on one page.
 */
export default function WelcomeExperience() {
  const pathname = usePathname()
  const { customer } = useAccount()
  // null until read after hydration: the server can't know what this browser stored.
  const [subscribed, setSubscribed] = useState<boolean | null>(null)
  const [page, setPage] = useState(pathname)
  const [skipped, setSkipped] = useState(false)
  const [thanking, setThanking] = useState(false)
  const consented = customer?.metadata?.marketing_consent === true

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

  const asking = subscribed === false && !consented && !QUIET_PATHS.test(pathname)
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
