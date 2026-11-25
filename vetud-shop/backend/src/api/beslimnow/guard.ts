import { createHash, timingSafeEqual } from "node:crypto"
import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/** Header the BeSlimNow page sends with BESLIMNOW_API_SECRET (set the same value on both sites). */
export const BESLIMNOW_SECRET_HEADER = "x-beslimnow-secret"

const digest = (value: string) => createHash("sha256").update(value).digest()

/**
 * Only the BeSlimNow site's server may write its rows. Without BESLIMNOW_API_SECRET on this server
 * the routes are off (503), so nothing is accepted by accident.
 */
export function requireBeslimnowSecret(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const expected = process.env.BESLIMNOW_API_SECRET?.trim()
  if (!expected) {
    res.status(503).json({ message: "BeSlimNow saving is not set up on this server." })
    return
  }
  const given = req.headers[BESLIMNOW_SECRET_HEADER]
  if (typeof given !== "string" || !timingSafeEqual(digest(given.trim()), digest(expected))) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }
  next()
}
