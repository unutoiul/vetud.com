import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { deleteStorewideSaleWorkflow, updateStorewideSaleWorkflow } from "../../../../workflows/storewide-sale"
import type { AdminUpdateStorewideSaleType } from "../validators"

/** Edits a sale and recalculates its prices; an empty body only recalculates. */
export async function POST(req: AuthenticatedMedusaRequest<AdminUpdateStorewideSaleType>, res: MedusaResponse) {
  const { result } = await updateStorewideSaleWorkflow(req.scope).run({ input: { ...req.validatedBody, id: req.params.id } })
  res.json(result)
}

export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { result } = await deleteStorewideSaleWorkflow(req.scope).run({ input: { id: req.params.id } })
  res.json({ id: result.id, object: "storewide_sale", deleted: true })
}
