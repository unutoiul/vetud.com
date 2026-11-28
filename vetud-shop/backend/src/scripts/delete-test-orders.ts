import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { deleteTestOrdersWorkflow } from "../workflows/delete-test-orders"

/**
 * Removes test orders, keeping the orders of the emails in KEEP_EMAILS (owner, 2026-11-25: keep
 * janaroncesvalles16@gmail.com only). A preview by default; CONFIRM=yes hides the rest with a soft
 * delete (restorable). On Railway run it from /app:
 *
 *   npx medusa exec ./src/scripts/delete-test-orders.ts                 (preview, changes nothing)
 *   CONFIRM=yes npx medusa exec ./src/scripts/delete-test-orders.ts     (delete)
 */
const DEFAULT_KEEP = "janaroncesvalles16@gmail.com"

type OrderRow = {
  id: string
  display_id?: number | null
  email?: string | null
  created_at: string | Date
  total?: unknown
  currency_code?: string | null
  status?: string | null
}

export default async function deleteTestOrders({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const keep = new Set(
    (process.env.KEEP_EMAILS || DEFAULT_KEEP)
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  )
  const apply = process.env.CONFIRM === "yes"

  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "email", "created_at", "total", "currency_code", "status"],
    pagination: { take: 10000, skip: 0, order: { created_at: "ASC" } },
  })
  const orders = data as OrderRow[]
  const line = (order: OrderRow) =>
    `#${order.display_id ?? "?"}  ${new Date(order.created_at).toISOString().slice(0, 10)}  ${order.email ?? "(no email)"}  ${Number(order.total ?? 0).toFixed(2)} ${(order.currency_code ?? "").toUpperCase()}  ${order.status ?? ""}`
  const kept = orders.filter((order) => keep.has((order.email ?? "").trim().toLowerCase()))
  const remove = orders.filter((order) => !kept.includes(order))

  logger.info(
    `Keeping ${kept.length} order(s) for ${[...keep].join(", ")}:\n${kept.map(line).join("\n") || "  (none)"}`,
  )
  // A typo in the email would otherwise delete every order.
  if (apply && !kept.length) {
    logger.warn(`No order found for ${[...keep].join(", ")}. Stopping without deleting anything; check the email.`)
    return
  }
  logger.info(
    `${apply ? "Deleting" : "Would delete"} ${remove.length} order(s):\n${remove.map(line).join("\n") || "  (none)"}`,
  )

  if (!apply) {
    logger.info("Preview only, nothing changed. Run again with CONFIRM=yes to delete these orders.")
    return
  }
  const { result } = await deleteTestOrdersWorkflow(container).run({
    input: { order_ids: remove.map((order) => order.id) },
  })
  logger.info(`Done: ${result.deleted} order(s) deleted; ${kept.length} kept.`)
}
