"use server"

import { updateTag } from "next/cache"

const THREAD_ID = /^fthr_[A-Za-z0-9]{10,40}$/

/**
 * Called by the browser after a member posts, votes or reports, so the cached public pages show
 * the change on the next request. It only expires public caches; anyone may call it.
 */
export async function revalidateCommunity(threadId?: string) {
  updateTag("forum")
  if (threadId && THREAD_ID.test(threadId)) updateTag(`forum-thread:${threadId}`)
}
