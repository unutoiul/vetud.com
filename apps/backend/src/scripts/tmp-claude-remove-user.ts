import type { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
export default async function removeUser({ container }: ExecArgs) {
  const users = container.resolve(Modules.USER)
  const auth = container.resolve(Modules.AUTH)
  const found = await users.listUsers({ email: "claude-sale-test@example.com" })
  if (found.length) await users.deleteUsers(found.map((u) => u.id))
  const identities = await auth.listProviderIdentities({ entity_id: "claude-sale-test@example.com" }, { relations: ["auth_identity"] })
  const authIds = [...new Set(identities.map((i) => i.auth_identity_id).filter((id): id is string => !!id))]
  if (authIds.length) await auth.deleteAuthIdentities(authIds)
  console.log("REMOVED users", found.length, "auth identities", authIds.length)
}
