import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { publicMember, type ProfileRecord } from "../../../../lib/forum/public"
import { viewerProfile } from "../../../../lib/forum/read"
import { suggestedDisplayName } from "../../../../lib/forum/text"
import { saveForumProfileWorkflow } from "../../../../workflows/forum/profile"
import type { StoreSaveForumProfileBody } from "../validators"

function ownProfile(profile: ProfileRecord | null) {
  return profile ? { ...publicMember(profile), status: profile.status } : null
}

/** The signed-in customer's community profile, or a suggested name when they haven't joined yet. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const profile = await viewerProfile(req.scope, req.auth_context.actor_id)
  let suggested = ""
  if (!profile) {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({ entity: "customer", fields: ["first_name", "last_name"], filters: { id: req.auth_context.actor_id } })
    suggested = suggestedDisplayName(data[0]?.first_name, data[0]?.last_name)
  }
  res.setHeader("Cache-Control", "private, no-store")
  res.json({ profile: ownProfile(profile), suggested_name: suggested })
}

/** Joins the community (accepting the guidelines) or renames the profile. */
export async function POST(req: AuthenticatedMedusaRequest<StoreSaveForumProfileBody>, res: MedusaResponse) {
  await saveForumProfileWorkflow(req.scope).run({
    input: { customer_id: req.auth_context.actor_id, display_name: req.validatedBody.display_name, bio: req.validatedBody.bio },
  })
  res.setHeader("Cache-Control", "private, no-store")
  res.json({ profile: ownProfile(await viewerProfile(req.scope, req.auth_context.actor_id)) })
}
