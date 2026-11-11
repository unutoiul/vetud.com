import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { recountForumReputationWorkflow } from "../workflows/forum/reputation"

/**
 * Runs once on deploy (owner's request, 2026-11-12): published posts now earn reputation, up to a
 * cap, and there are six levels. Recounts every member so their level matches the new rules.
 */
export default async function recountParticipationReputation({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: profiles } = await query.graph({ entity: "forum_profile", fields: ["id"] })
  const ids = profiles.map((profile) => profile.id as string)
  if (ids.length) await recountForumReputationWorkflow(container).run({ input: { profile_ids: ids } })
  logger.info(`Forum: recounted reputation for ${ids.length} members.`)
}
