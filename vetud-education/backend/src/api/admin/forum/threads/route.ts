import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { THREAD_FIELDS, type ThreadRecord } from "../../../../lib/forum/public"
import { loadProfiles } from "../../../../lib/forum/read"
import type { AdminForumThreadsQueryType } from "../validators"

/** Every thread in any state, latest activity first, for Admin > Community. */
export async function GET(req: AuthenticatedMedusaRequest<unknown, AdminForumThreadsQueryType>, res: MedusaResponse) {
  const { q, status, kind, offset, limit } = req.validatedQuery
  const filters: Record<string, unknown> = {}
  if (status) filters.status = status
  if (kind) filters.kind = kind
  if (q) filters.title = { $ilike: `%${q.replace(/[\\%_]/g, character => `\\${character}`)}%` }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data, metadata } = await query.graph({
    entity: "forum_thread",
    fields: THREAD_FIELDS,
    filters,
    pagination: { skip: offset, take: limit, order: { last_activity_at: "DESC" } },
  })
  const threads = data as ThreadRecord[]
  const authors = await loadProfiles(req.scope, threads.map(thread => thread.author_id))
  res.json({
    threads: threads.map(thread => ({ ...thread, author: authors.get(thread.author_id) ?? null })),
    count: metadata?.count ?? threads.length,
    offset,
    limit,
  })
}
