import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { listThreads, threadDetail, viewerProfile } from "../../../../lib/forum/read"
import { createForumThreadWorkflow } from "../../../../workflows/forum/threads"
import type { StoreCreateForumThreadBody, StoreForumThreadsQueryType } from "../validators"

/** Published threads, filterable by kind, topic, peptide, lot, product or author. Works signed out. */
export async function GET(req: AuthenticatedMedusaRequest<unknown, StoreForumThreadsQueryType>, res: MedusaResponse) {
  const { kind, topic, peptide, lot, product, author, sort, q, offset, limit } = req.validatedQuery
  const viewer = await viewerProfile(req.scope, req.auth_context?.actor_id)
  const { threads, count } = await listThreads(req.scope, { kind, topic, peptides: peptide, lot, product, author, sort, q, offset, limit }, viewer)

  res.setHeader("Cache-Control", viewer ? "private, no-store" : "public, max-age=30")
  res.json({ threads, count, offset, limit })
}

export async function POST(req: AuthenticatedMedusaRequest<StoreCreateForumThreadBody>, res: MedusaResponse) {
  const body = req.validatedBody
  const { result } = await createForumThreadWorkflow(req.scope).run({
    input: {
      // The author is always the signed-in customer, never a value from the request body.
      customer_id: req.auth_context.actor_id,
      kind: body.kind,
      title: body.title,
      body: body.body,
      topic: body.topic,
      peptide_slug: body.peptide,
      product_handle: body.product,
      lot: body.lot,
      images: body.images,
    },
  })

  const viewer = await viewerProfile(req.scope, req.auth_context.actor_id)
  const detail = await threadDetail(req.scope, result.thread.id, viewer, { offset: 0, limit: 50 })
  res.setHeader("Cache-Control", "private, no-store")
  res.status(201).json(detail)
}
