"use client"

import Clarity from "@microsoft/clarity"
import { useEffect } from "react"
import { CLARITY_HOSTS, CLARITY_ID, cookielessAnalytics } from "@/lib/analytics"

let started = false

/** Starts Microsoft Clarity once the page is idle, on the live site only (see lib/analytics.ts). */
export default function ClarityAnalytics({ language }: { language: string }) {
  useEffect(() => {
    if (!CLARITY_ID || !CLARITY_HOSTS.includes(window.location.hostname)) return
    const run = () => {
      if (!started) {
        Clarity.init(CLARITY_ID)
        started = true
      }
      Clarity.consentV2({ ad_Storage: "denied", analytics_Storage: cookielessAnalytics() ? "denied" : "granted" })
      Clarity.setTag("language", language)
    }
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(run, { timeout: 4000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = setTimeout(run, 1500)
    return () => clearTimeout(id)
  }, [language])
  return null
}
