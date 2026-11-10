import { MedusaError } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows"
import sharp from "sharp"
import { activeProfile, assertNotTooSoon, forumService } from "./shared"

/** File contents are base64, so the workflow input stays serializable. */
export type UploadForumImagesInput = { customer_id: string; files: { content: string }[] }

/** Uploads per member per hour, attached or not. */
const UPLOADS_PER_HOUR = 30
/** Longest side after resizing; plenty for a progress photo, and keeps files small. */
const MAX_DIMENSION = 2000

/**
 * Re-encodes each photo as WebP: turned upright, resized, and stripped of metadata (phone photos
 * carry GPS location). Anything sharp can't read as an image is rejected.
 */
const prepareForumImagesStep = createStep(
  "prepare-forum-images",
  async (input: UploadForumImagesInput, { container }) => {
    const service = forumService(container)
    const profile = await activeProfile(service, input.customer_id)
    if (!input.files.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Choose a photo to upload.")
    const since = new Date(Date.now() - 60 * 60 * 1000)
    const [recent, count] = await service.listAndCountForumImages(
      { author_id: profile.id, created_at: { $gte: since } },
      { take: 1, order: { created_at: "DESC" }, withDeleted: true }
    )
    if (count + input.files.length > UPLOADS_PER_HOUR) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "You've uploaded a lot of photos in the last hour. Please try again later.")
    }
    assertNotTooSoon(recent[0], 1000, "Please wait a moment before uploading more photos.")

    const files = await Promise.all(input.files.map(async (file, index) => {
      try {
        const content = await sharp(Buffer.from(file.content, "base64"), { limitInputPixels: 50_000_000 })
          .rotate()
          .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer()
        return {
          filename: `community-${Date.now()}-${index}.webp`,
          mimeType: "image/webp",
          content: content.toString("base64"),
          access: "public" as const,
        }
      } catch {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "One of the files isn't a photo we can read. Please use JPEG, PNG or WebP.")
      }
    }))
    return new StepResponse({ profile_id: profile.id, files })
  }
)

const createForumImagesStep = createStep(
  "create-forum-images",
  async (input: { profile_id: string; files: { id: string; url: string }[] }, { container }) => {
    const service = forumService(container)
    const images = await service.createForumImages(input.files.map(file => ({ author_id: input.profile_id, file_id: file.id, url: file.url })))
    return new StepResponse(images.map(image => ({ id: image.id, url: image.url })), images.map(image => image.id))
  },
  async (ids, { container }) => {
    if (ids?.length) await forumService(container).deleteForumImages(ids)
  }
)

/** Stores photos for a post the member is about to publish. The post claims them by ID. */
export const uploadForumImagesWorkflow = createWorkflow(
  "upload-forum-images",
  function (input: UploadForumImagesInput) {
    const prepared = prepareForumImagesStep(input)
    const uploadInput = transform({ prepared }, ({ prepared }) => ({ files: prepared.files }))
    const files = uploadFilesWorkflow.runAsStep({ input: uploadInput })
    const images = createForumImagesStep(transform({ prepared, files }, ({ prepared, files }) => ({
      profile_id: prepared.profile_id,
      files: files.map(file => ({ id: file.id, url: file.url })),
    })))
    return new WorkflowResponse(images)
  }
)
