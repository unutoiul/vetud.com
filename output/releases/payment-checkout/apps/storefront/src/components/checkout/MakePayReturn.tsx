"use client"

import Alert from "@mui/material/Alert"
import CircularProgress from "@mui/material/CircularProgress"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useEffect, useState } from "react"
import { MEDUSA_BACKEND_URL, MEDUSA_PUBLISHABLE_KEY } from "@/lib/config"
import { MAKEPAY_STORAGE } from "@/lib/makepay"
import { ButtonLink } from "../common/links"
import { useStore } from "../store/StoreProvider"

type Status = "pending_authorization" | "paid" | "failed" | "canceled"

const MAX_ATTEMPTS = 30
const retryDelay = (attempt: number) => Math.min(1000 * 2 ** Math.min(attempt, 3), 5000)

function read(key: string) {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.sessionStorage.removeItem(key)
    else window.sessionStorage.setItem(key, value)
  } catch {
    // Storage can be unavailable (private mode); the state in the URL is enough for one visit.
  }
}

/**
 * Landing page after MakePay's hosted checkout. The query string is never proof of payment:
 * it only carries an opaque state that we exchange for the real status from the backend.
 */
export default function MakePayReturn() {
  const { countryCode } = useStore()
  const [message, setMessage] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<"waiting" | "info" | "retry">("waiting")

  useEffect(() => {
    const url = new URL(window.location.href)
    const state = url.searchParams.get("makepay_state") || read(MAKEPAY_STORAGE.returnState)
    let stopped = false
    let timer: number | undefined
    const controller = new AbortController()

    if (!state) {
      timer = window.setTimeout(() => {
        setOutcome("info")
        setMessage("We couldn't find your payment. If you paid, check your email for the order confirmation.")
      }, 0)
      return () => window.clearTimeout(timer)
    }
    write(MAKEPAY_STORAGE.returnState, state)
    url.searchParams.delete("makepay_state")
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)

    const schedule = (attempt: number) => {
      if (attempt >= MAX_ATTEMPTS) {
        setOutcome("info")
        setMessage("Your payment is still pending. You can safely close this page; we'll email you once it's confirmed.")
        return
      }
      timer = window.setTimeout(() => void poll(attempt), retryDelay(attempt))
    }

    async function poll(attempt: number): Promise<void> {
      try {
        const endpoint = new URL("/store/makepay/checkout-status", MEDUSA_BACKEND_URL)
        endpoint.searchParams.set("state", state as string)
        const response = await fetch(endpoint, {
          cache: "no-store",
          headers: MEDUSA_PUBLISHABLE_KEY ? { "x-publishable-api-key": MEDUSA_PUBLISHABLE_KEY } : undefined,
          signal: controller.signal,
        })
        if (response.status === 404) {
          write(MAKEPAY_STORAGE.returnState, null)
          setOutcome("info")
          setMessage("This payment link is no longer valid.")
          return
        }
        if (!response.ok) throw new Error("status unavailable")

        const result = (await response.json()) as { payment?: { status?: Status } }
        const status = result.payment?.status
        if (!status) throw new Error("invalid status")

        if (status === "paid") {
          const orderId = read(MAKEPAY_STORAGE.orderId)
          const country = read(MAKEPAY_STORAGE.countryCode) || countryCode
          write(MAKEPAY_STORAGE.returnState, null)
          write(MAKEPAY_STORAGE.orderId, null)
          write(MAKEPAY_STORAGE.countryCode, null)
          if (!orderId) {
            setOutcome("info")
            setMessage("Payment confirmed. Your order confirmation is on its way by email.")
            return
          }
          window.location.replace(
            `/${encodeURIComponent(country)}/order/confirmed?id=${encodeURIComponent(orderId)}&paid=1`
          )
          return
        }
        if (status === "failed" || status === "canceled") {
          write(MAKEPAY_STORAGE.returnState, null)
          setOutcome("retry")
          setMessage(`The payment was ${status}. Nothing was charged for this attempt.`)
          return
        }
        schedule(attempt + 1)
      } catch (error) {
        if (stopped || (error instanceof DOMException && error.name === "AbortError")) return
        if (attempt + 1 >= MAX_ATTEMPTS) {
          setOutcome("info")
          setMessage("We can't confirm your payment right now. Check your email before trying again.")
          return
        }
        schedule(attempt + 1)
      }
    }

    void poll(0)
    return () => {
      stopped = true
      controller.abort()
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [countryCode])

  if (outcome === "waiting") {
    return (
      <Stack spacing={2} sx={{ py: 8, alignItems: "center" }} role="status" aria-live="polite">
        <CircularProgress color="secondary" />
        <Typography>Confirming your payment…</Typography>
      </Stack>
    )
  }

  return (
    <Stack spacing={3} sx={{ py: 4, alignItems: "flex-start" }}>
      <Alert severity={outcome === "retry" ? "warning" : "info"}>{message}</Alert>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        {outcome === "retry" ? (
          <ButtonLink href="/checkout" variant="contained">
            Back to checkout
          </ButtonLink>
        ) : null}
        <ButtonLink href="/contact" variant="outlined">
          Contact us
        </ButtonLink>
      </Stack>
    </Stack>
  )
}
