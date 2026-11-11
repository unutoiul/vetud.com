"use client"

import { useEffect, useState } from "react"
import { sdk } from "@/lib/medusa/sdk"
import type { ForumMemberPage, ForumThread, OwnForumProfile, OwnForumStats, ReputationRules } from "@/lib/community/types"
import { useAccount } from "../account/AccountProvider"
import { DEFAULT_RULES } from "./reputation"

type MeResponse = { profile: OwnForumProfile | null; suggested_name: string; stats?: OwnForumStats | null; reputation?: ReputationRules }

export type OwnProfileState = {
  loading: boolean
  failed: boolean
  profile: OwnForumProfile | null
  suggested: string
  /** Null until known. An older backend sends no stats; the member page's totals fill in threads and replies. */
  stats: Partial<OwnForumStats> | null
  rules: ReputationRules
  /** The member's latest discussions, including ones waiting for review. */
  threads: ForumThread[]
}

const EMPTY: OwnProfileState = { loading: true, failed: false, profile: null, suggested: "", stats: null, rules: DEFAULT_RULES, threads: [] }

/** Loads the profile, the member's numbers and their latest discussions. Never throws. */
async function fetchOwnProfile(): Promise<Omit<OwnProfileState, "loading">> {
  try {
    const me = await sdk.client.fetch<MeResponse>("/store/forum/me", { cache: "no-store" })
    let threads: ForumThread[] = []
    let stats: Partial<OwnForumStats> | null = me.stats ?? null
    if (me.profile?.handle) {
      const page = await sdk.client.fetch<ForumMemberPage>(`/store/forum/members/${encodeURIComponent(me.profile.handle)}`, { cache: "no-store" }).catch(() => null)
      threads = page?.threads ?? []
      if (!stats && page) stats = { threads: page.totals.threads, replies: page.totals.replies }
    }
    return { failed: false, profile: me.profile, suggested: me.suggested_name, stats, rules: me.reputation ?? DEFAULT_RULES, threads }
  } catch {
    return { ...EMPTY, failed: true }
  }
}

/** The signed-in customer's community profile, numbers and latest discussions, for the account page. */
export function useOwnProfile() {
  const { customer, loading: accountLoading } = useAccount()
  const customerId = customer?.id
  const [state, setState] = useState<OwnProfileState & { customerId?: string }>(EMPTY)

  // Results are stored with the customer they belong to, so a late answer for another account is ignored.
  useEffect(() => {
    if (accountLoading || !customerId) return
    let cancelled = false
    void fetchOwnProfile().then((loaded) => { if (!cancelled) setState({ ...loaded, loading: false, customerId }) })
    return () => { cancelled = true }
  }, [accountLoading, customerId])

  const current = customerId && state.customerId === customerId ? state : EMPTY
  return {
    ...current,
    loading: accountLoading || current.loading,
    /** Reloads after a change, e.g. a new community name. */
    reload: async () => {
      if (!customerId) return
      const loaded = await fetchOwnProfile()
      setState({ ...loaded, loading: false, customerId })
    },
    setProfile: (profile: OwnForumProfile) => setState((previous) => ({ ...previous, profile })),
  }
}
