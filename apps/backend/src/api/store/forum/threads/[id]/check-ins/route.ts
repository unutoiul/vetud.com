import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { threadDetail, viewerProfile } from "../../../../../../lib/forum/read"
import { addForumCheckInWorkflow } from "../../../../../../workflows/forum/posts"
import type { StoreForumCheckInBody } from "../../../validators"

/** Adds a week's measurements to the signed-in member's own research log, and returns the updated log. */
export async function POST(req: AuthenticatedMedusaRequest<StoreForumCheckInBody>, res: MedusaResponse) {
  const { week, body, measurements } = req.validatedBody
  await addForumCheckInWorkflow(req.scope).run({
    input: {
      customer_id: req.auth_context.actor_id,
      thread_id: req.params.id,
      week,
      body,
      measurements: measurements.map(measurement => ({ ...measurement, week })),
    },
  })
  const viewer = await viewerProfile(req.scope, req.auth_context.actor_id)
  res.setHeader("Cache-Control", "private, no-store")
  res.status(201).json(await threadDetail(req.scope, req.params.id, viewer, { offset: 0, limit: 50 }))
}
