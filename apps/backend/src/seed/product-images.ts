import { existsSync, readFileSync } from "fs"
import path from "path"
import type { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
}

/**
 * Finds a file in `apps/backend/assets/products`. Migrations run from the app root locally and
 * from `.medusa/server` in production, so both locations are checked.
 */
export function findProductAsset(filename: string) {
  const roots = [process.cwd(), path.resolve(process.cwd(), "..", "..")]
  for (const root of roots) {
    const candidate = path.join(root, "assets", "products", filename)
    if (existsSync(candidate)) return candidate
  }
  return null
}

/** Uploads a product photo through the File Module and returns its public URL. */
export async function uploadProductImage(container: MedusaContainer, filename: string) {
  const file = findProductAsset(filename)
  if (!file) return null

  const fileModule = container.resolve(Modules.FILE)
  const [uploaded] = await fileModule.createFiles([
    {
      filename,
      mimeType: MIME_TYPES[path.extname(filename).toLowerCase()] ?? "application/octet-stream",
      content: readFileSync(file).toString("base64"),
      access: "public",
    },
  ])
  return uploaded.url
}
