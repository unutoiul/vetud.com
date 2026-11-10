"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useAccount } from "../account/AccountProvider"
import OfferPopup from "../newsletter/OfferPopup"
import { subscribedInBrowser } from "../newsletter/subscription"
import WelcomeSplash from "./WelcomeSplash"

const VISIT_KEY = "vetud_welcome_v2"

/** One welcome per tab. Deep links and transactional pages remain uninterrupted. */
export default function WelcomeExperience() {
  const pathname = usePathname()
  const { customer } = useAccount()
  const [visit, setVisit] = useState<"checking" | "new" | "welcomed">("checking")
  const [subscribed, setSubscribed] = useState(false)
  const isHomepage = /^\/[^/]+\/?$/.test(pathname)
  const consented = customer?.metadata?.marketing_consent === true

  useEffect(() => {
    const isSubscriber = subscribedInBrowser()
    let welcomed = isSubscriber
    try {
      welcomed ||= window.sessionStorage.getItem(VISIT_KEY) === "welcomed"
    } catch {
      // The in-memory state still remembers dismissal when browser storage is unavailable.
    }
    const frame = window.requestAnimationFrame(() => {
      setSubscribed(isSubscriber)
      setVisit(welcomed ? "welcomed" : "new")
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const dismiss = () => {
    try {
      window.sessionStorage.setItem(VISIT_KEY, "welcomed")
    } catch {
      // Navigation and dismissal must work in privacy-restricted browsers too.
    }
    setVisit("welcomed")
  }

  const showWelcome = visit === "new" && isHomepage && !consented

  return <>
    <WelcomeSplash open={showWelcome} onDismiss={dismiss} onSubscribed={() => setSubscribed(true)} />
    {/* Don't follow a declined welcome with a second signup request on the same visit. */}
    <OfferPopup enabled={visit === "new" && !showWelcome && !subscribed && !consented} />
  </>
}
