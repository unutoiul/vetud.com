import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * The bare backend address (admin.vetudpeptides.com) opens the Medusa Admin, which lives under /app.
 * The Admin can't move to "/" itself: it would sit in front of the API, webhooks and /health.
 */
export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.redirect(302, "/app")
}
