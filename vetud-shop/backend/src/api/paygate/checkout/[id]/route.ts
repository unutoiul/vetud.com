import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/** Old payment links must not start a checkout after this method's retirement. */
export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Cache-Control", "no-store")
  res.status(410).json({ message: "This payment method is no longer available. Please contact the store about an existing order." })
}
