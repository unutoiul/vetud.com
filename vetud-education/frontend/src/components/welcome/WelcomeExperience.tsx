"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { subscribedInBrowser } from "../newsletter/subscription"
import WelcomeSplash from "./WelcomeSplash"

const VISIT_KEY = "vetud_welcome_v2"

/** One welcome per tab, on the home page only. Deep links remain uninterrupted. */
export default function WelcomeExperience() {
  const pathname = usePathname()
  const [visit, setVisit] = useState<"checking" | "new" | "welcomed">("checking")
  const isHomepage = /^\/[^/]+\/?$/.test(pathname)

  useEffect(() => {
    let welcomed = subscribedInBrowser()
    try {
      welcomed ||= window.sessionStorage.getItem(VISIT_KEY) === "welcomed"
    } catch {
      // The in-memory state still remembers dismissal when browser storage is unavailable.
    }
    const frame = window.requestAnimationFrame(() => setVisit(welcomed ? "welcomed" : "new"))
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

  return <WelcomeSplash open={visit === "new" && isHomepage} onDismiss={dismiss} />
}
