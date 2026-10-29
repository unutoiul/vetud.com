import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { reconcilePaygateWorkflow } from "../../../workflows/paygate"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Cache-Control", "no-store")
  await reconcilePaygateWorkflow(req.scope).run({ input: { originalUrl: req.originalUrl, headers: req.headers } })
  res.type("text/plain").send("ok")
}
