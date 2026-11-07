import { model } from "@medusajs/framework/utils"

/** Reviewed translations. Public keys are separated from unpublished store content. */
const ContentBundle = model.define("localized_content_bundle", {
  id: model.id({ prefix: "lcb" }).primaryKey(),
  locale: model.text().unique(),
  source_hash: model.text(),
  sources: model.json(),
  translations: model.json(),
  public_translations: model.json(),
  entry_count: model.number(),
  review: model.json(),
})

export default ContentBundle
