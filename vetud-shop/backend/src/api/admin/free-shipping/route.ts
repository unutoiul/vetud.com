import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { readFreeShipping, setFreeShippingWorkflow } from "../../../workflows/free-shipping"
import type { AdminSetFreeShippingBody } from "./validators"

/** GET /admin/free-shipping: the dollar amount and what each region gets. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Cache-Control", "private, no-store")
  res.json(await readFreeShipping(req.scope))
}

/** POST /admin/free-shipping `{ amount_usd: number | null }`: sets free Standard shipping everywhere, or turns it off. */
export async function POST(req: MedusaRequest<AdminSetFreeShippingBody>, res: MedusaResponse) {
  await setFreeShippingWorkflow(req.scope).run({ input: { amount_usd: req.validatedBody.amount_usd } })
  res.json(await readFreeShipping(req.scope))
}
