import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PROFILE_FIELDS } from "../../../../lib/forum/public"
import type { AdminForumMembersQueryType } from "../validators"

/** Community members, highest reputation first. */
export async function GET(req: AuthenticatedMedusaRequest<unknown, AdminForumMembersQueryType>, res: MedusaResponse) {
  const { q, role, offset, limit } = req.validatedQuery
  const filters: Record<string, unknown> = {}
  if (role) filters.role = role
  if (q) filters.display_name = { $ilike: `%${q.replace(/[\\%_]/g, character => `\\${character}`)}%` }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data, metadata } = await query.graph({
    entity: "forum_profile",
    fields: PROFILE_FIELDS,
    filters,
    pagination: { skip: offset, take: limit, order: { reputation: "DESC", created_at: "ASC" } },
  })
  res.json({ members: data, count: metadata?.count ?? data.length, offset, limit })
}
