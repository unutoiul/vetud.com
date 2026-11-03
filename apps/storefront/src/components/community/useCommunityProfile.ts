"use client"

import { useEffect, useState } from "react"
import { sdk } from "@/lib/medusa/sdk"
import type { OwnForumProfile } from "@/lib/community/types"
import { useAccount } from "../account/AccountProvider"

// The profile is stored with the customer it belongs to, so switching accounts shows loading
// until the new customer's profile arrives.
type ProfileState = { customerId: string; failed: boolean; profile: OwnForumProfile | null; suggested: string }

/** The signed-in customer's community profile (null until they join). */
export function useCommunityProfile() {
  const { customer, loading: accountLoading } = useAccount()
  const [state, setState] = useState<ProfileState | null>(null)
  const customerId = customer?.id

  useEffect(() => {
    if (accountLoading || !customerId) return
    let cancelled = false
    sdk.client.fetch<{ profile: OwnForumProfile | null; suggested_name: string }>("/store/forum/me", { cache: "no-store" })
      .then(data => { if (!cancelled) setState({ customerId, failed: false, profile: data.profile, suggested: data.suggested_name }) })
      .catch(() => { if (!cancelled) setState({ customerId, failed: true, profile: null, suggested: "" }) })
    return () => { cancelled = true }
  }, [accountLoading, customerId])

  const current = customerId && state?.customerId === customerId ? state : null
  return {
    profile: current?.profile ?? null,
    suggested: current?.suggested ?? "",
    failed: current?.failed ?? false,
    loading: accountLoading || (Boolean(customerId) && !current),
    signedIn: Boolean(customerId),
    setProfile: (profile: OwnForumProfile) => { if (customerId) setState({ customerId, failed: false, profile, suggested: "" }) },
  }
}

/** The backend's message for a failed request, or a fallback. */
export function forumError(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "status" in error && error.status === 401) return "Your session has expired. Please sign in again."
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string" && error.message) return error.message
  return fallback
}
