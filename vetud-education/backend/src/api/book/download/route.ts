import { createReadStream } from "node:fs"
import { stat } from "node:fs/promises"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOK, bookPdfPath, hostedBookUrl, paidBookSession } from "../../../lib/book"

/**
 * The link in the buyer's email. It checks the Stripe payment, then sends the PDF (or forwards to
 * BOOK_DOWNLOAD_URL). It sits outside /store so a plain link works without a publishable key.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Cache-Control", "private, no-store")
  res.setHeader("X-Robots-Tag", "noindex")
  const sessionId = typeof req.query.session_id === "string" ? req.query.session_id.trim() : ""
  if (!(await paidBookSession(sessionId))) {
    res.status(403).json({ message: "This download link isn't valid. Use the link from your email, or contact us at contact@vetud.com." })
    return
  }
  const hosted = hostedBookUrl()
  if (hosted) {
    res.redirect(302, hosted)
    return
  }
  const path = bookPdfPath()
  if (!path) {
    res.status(503).json({ message: "The book isn't available right now. Please write to contact@vetud.com and we'll send it to you." })
    return
  }
  const { size } = await stat(path)
  res.setHeader("Content-Type", "application/pdf")
  res.setHeader("Content-Length", String(size))
  res.setHeader("Content-Disposition", `attachment; filename="${BOOK.downloadName}"`)
  createReadStream(path).pipe(res)
}
