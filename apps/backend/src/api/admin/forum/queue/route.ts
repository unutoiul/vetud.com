import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { POST_FIELDS, type PostRecord } from "../../../../lib/forum/public"
import { loadImages, loadProfiles } from "../../../../lib/forum/read"
import type { AdminForumQueueQueryType } from "../validators"

type ReportRecord = { id: string; post_id: string; reason: string; note?: string | null; created_at: string }

/**
 * Posts that need a decision, oldest first: held for review (doses, new members' links), hidden
 * after reports, or published with open reports.
 */
export async function GET(req: AuthenticatedMedusaRequest<unknown, AdminForumQueueQueryType>, res: MedusaResponse) {
  const { offset, limit } = req.validatedQuery
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: reportData } = await query.graph({
    entity: "forum_report",
    fields: ["id", "post_id", "reason", "note", "created_at"],
    filters: { status: "open" },
  })
  const reports = reportData as ReportRecord[]
  const reported = [...new Set(reports.map(report => report.post_id))]
  const { data, metadata } = await query.graph({
    entity: "forum_post",
    fields: POST_FIELDS,
    filters: { $or: [{ status: "pending" }, { status: "hidden", hold_reason: "reports" }, ...(reported.length ? [{ id: reported }] : [])] },
    pagination: { skip: offset, take: limit, order: { created_at: "ASC" } },
  })
  const posts = data as PostRecord[]
  const threadIds = [...new Set(posts.map(post => post.thread_id))]
  const [{ data: threads }, authors, images] = await Promise.all([
    threadIds.length
      ? query.graph({ entity: "forum_thread", fields: ["id", "title", "slug", "kind", "status"], filters: { id: threadIds } })
      : Promise.resolve({ data: [] }),
    loadProfiles(req.scope, posts.map(post => post.author_id)),
    loadImages(req.scope, posts.map(post => post.id)),
  ])
  const threadById = new Map((threads as { id: string }[]).map(thread => [thread.id, thread]))

  res.json({
    items: posts.map(post => ({
      post,
      thread: threadById.get(post.thread_id) ?? null,
      author: authors.get(post.author_id) ?? null,
      reports: reports.filter(report => report.post_id === post.id),
      images: images.get(post.id) ?? [],
    })),
    count: metadata?.count ?? posts.length,
    offset,
    limit,
  })
}
