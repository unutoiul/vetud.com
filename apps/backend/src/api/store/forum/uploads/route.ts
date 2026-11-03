import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { uploadForumImagesWorkflow } from "../../../../workflows/forum/images"

type UploadedFile = { buffer: Buffer }

/** Photos for a post the member is writing (multipart field "files"). Returns IDs the post sends back. */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const files = (req as AuthenticatedMedusaRequest & { files?: UploadedFile[] }).files ?? []
  if (!files.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Choose a photo to upload.")

  const { result } = await uploadForumImagesWorkflow(req.scope).run({
    input: { customer_id: req.auth_context.actor_id, files: files.map(file => ({ content: file.buffer.toString("base64") })) },
  })

  res.setHeader("Cache-Control", "private, no-store")
  res.status(201).json({ images: result })
}
