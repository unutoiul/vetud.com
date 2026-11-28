import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { paidBookSession } from "../../../../lib/book"
import type { StoreBookOrderQueryType } from "../validators"

/** Whether a returning buyer's Checkout Session is paid, for the download page. */
export async function GET(req: MedusaRequest<unknown, StoreBookOrderQueryType>, res: MedusaResponse) {
  const session = await paidBookSession(req.validatedQuery.session_id)
  res.setHeader("Cache-Control", "private, no-store")
  res.json(
    session
      ? { paid: true, email: session.customer_details?.email ?? session.customer_email ?? null }
      : { paid: false, email: null },
  )
}
