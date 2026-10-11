import { search } from "@medusajs/framework/utils"
import {
  createDefaultTransform,
  defineProductSearchIndex,
  PRODUCT_GRAPH_FIELDS,
  productSearchSchema,
} from "@rokmohar/medusa-plugin-meilisearch/indexes"
import { parseLots } from "../lib/lots"

const GRAPH_FIELDS = [...PRODUCT_GRAPH_FIELDS, "metadata"]
const baseTransform = createDefaultTransform(GRAPH_FIELDS)

function readMetadata(entity: Record<string, unknown>): Record<string, unknown> {
  const metadata = entity.metadata
  return metadata && typeof metadata === "object"
    ? (metadata as Record<string, unknown>)
    : {}
}

function readLotNumbers(metadata: Record<string, unknown>): string[] {
  return parseLots(metadata.lots).map((entry) => entry.lot)
}

/**
 * The storefront product index. On top of the plugin's default product schema it
 * holds the Vetud product code (e.g. "VTD-01") and every documented lot number,
 * so customers can find a product by typing a lot number from their COA.
 */
export default defineProductSearchIndex({
  fields: search.define({
    ...productSearchSchema(),
    code: search.text().searchable({ weight: 5 }).retrievable(),
    lot_numbers: search
      .keyword()
      .array()
      .searchable({ weight: 4 })
      .filterable()
      .retrievable(),
  }),
  graph_fields: ["metadata"],
  transform: (entity, context) => {
    const { metadata: _metadata, ...document } = baseTransform(entity, context)
    const metadata = readMetadata(entity)

    return {
      ...document,
      code: typeof metadata.code === "string" ? metadata.code : null,
      lot_numbers: readLotNumbers(metadata),
    }
  },
  settings: {
    typo_tolerance: { enabled: true },
  },
})
