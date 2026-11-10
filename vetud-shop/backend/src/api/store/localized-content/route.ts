import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { contentLocale } from "../../../lib/localized-content"
import { LOCALIZED_CONTENT_MODULE } from "../../../modules/localized-content"
import type LocalizedContentModuleService from "../../../modules/localized-content/service"

/** Only reviewed, public text is exposed. Draft translations and sources remain private. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const locale = contentLocale(req.query.locale)
  if (!locale) return res.status(400).json({ message: "Unsupported content locale." })
  const service = req.scope.resolve<LocalizedContentModuleService>(LOCALIZED_CONTENT_MODULE)
  const [bundle] = await service.listContentBundles({ locale }, {
    take: 1, select: ["locale", "source_hash", "sources", "public_translations"],
  })
  if (!bundle) return res.status(404).json({ message: "Reviewed content is not available for this locale." })
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300")
  const templates: Record<string, { source: string; target: string }> = {}
  for (const [key, target] of Object.entries(bundle.public_translations)) {
    const source = bundle.sources[key]
    if (typeof source === "string" && typeof target === "string" && /\{v\d+\}/.test(source)) templates[key] = { source, target }
  }
  res.json({ locale: bundle.locale, source_hash: bundle.source_hash, translations: bundle.public_translations, templates })
}
