import { cacheLife, cacheTag } from "next/cache"
import { sdk } from "./sdk"
import type { ForumMemberPage, ForumStats, ForumThreadDetail, ForumThreadList, ThreadFilters } from "../community/types"

/**
 * Public community reads for Server Components. They never send a customer token (the server SDK
 * has none), so they return what signed-out visitors see; signed-in state is added in the browser.
 * Posting refreshes these through the `revalidateCommunity` Server Action.
 */

const isNotFound = (error: unknown) => Boolean(error && typeof error === "object" && "status" in error && error.status === 404)

function threadQuery({ peptides, ...filters }: ThreadFilters) {
  return Object.fromEntries(Object.entries({ ...filters, peptide: peptides?.length ? peptides.join(",") : undefined }).filter(([, value]) => value !== undefined && value !== ""))
}

export async function listForumThreads(filters: ThreadFilters): Promise<ForumThreadList> {
  "use cache"
  cacheLife("minutes")
  cacheTag("forum")
  return sdk.client.fetch<ForumThreadList>("/store/forum/threads", { query: threadQuery(filters) })
}

export async function getForumThread(id: string): Promise<ForumThreadDetail | null> {
  "use cache"
  cacheLife("minutes")
  cacheTag("forum", `forum-thread:${id}`)
  try {
    return await sdk.client.fetch<ForumThreadDetail>(`/store/forum/threads/${encodeURIComponent(id)}`, { query: { limit: 100 } })
  } catch (error) {
    if (isNotFound(error)) return null
    throw error
  }
}

/** Published member reports per lot number. Lots are sorted so equal sets share a cache entry. */
export async function getLotReportCounts(lots: string[]): Promise<Record<string, number>> {
  "use cache"
  cacheLife("hours")
  cacheTag("forum", "forum-lots")
  if (!lots.length) return {}
  const { counts } = await sdk.client.fetch<{ counts: Record<string, number> }>("/store/forum/lot-counts", { query: { lots: [...new Set(lots)].sort().join(",") } })
  return counts
}

export async function getForumStats(): Promise<ForumStats> {
  "use cache"
  cacheLife("minutes")
  cacheTag("forum")
  return sdk.client.fetch<ForumStats>("/store/forum/stats")
}

export async function getForumMember(handle: string): Promise<ForumMemberPage | null> {
  "use cache"
  cacheLife("minutes")
  cacheTag("forum", `forum-member:${handle}`)
  try {
    return await sdk.client.fetch<ForumMemberPage>(`/store/forum/members/${encodeURIComponent(handle)}`)
  } catch (error) {
    if (isNotFound(error)) return null
    throw error
  }
}

/** Latest thread IDs, for prerendering and the sitemap. */
export async function listForumThreadIds(limit = 50): Promise<string[]> {
  "use cache"
  cacheLife("minutes")
  cacheTag("forum")
  const ids: string[] = []
  for (let offset = 0; offset < limit; offset += 50) {
    const { threads, count } = await sdk.client.fetch<ForumThreadList>("/store/forum/threads", { query: { offset, limit: Math.min(50, limit - offset) } })
    ids.push(...threads.map(thread => thread.id))
    if (offset + 50 >= count) break
  }
  return ids
}
