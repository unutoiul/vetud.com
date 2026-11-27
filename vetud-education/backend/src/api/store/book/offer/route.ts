import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { readOfferToken } from "../../../../lib/book"
import type { StoreBookOfferQueryType } from "../validators"

/** For the book's page: the address in the email link's token, if the link is valid. */
export async function GET(req: MedusaRequest<unknown, StoreBookOfferQueryType>, res: MedusaResponse) {
  res.setHeader("Cache-Control", "private, no-store")
  res.json({ email: readOfferToken(req.validatedQuery.token) })
}
