import type { CreateProductVariantWorkflowInputDTO, UpsertProductDTO } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createProductVariantsWorkflow, updateProductOptionValuesOnProductStep, updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { boxSku, DUAL_CHAMBER_PRODUCTS, FORMAT_CONTENTS, PEN_KIT_BOX } from "../seed/dual-chamber-catalog"
import { usdPrice } from "./import-dual-chamber-catalog"

type ProductRow = {
  id: string
  handle: string
  metadata?: Record<string, unknown> | null
  options?: { id: string; title: string; values?: { value: string }[] }[]
}

/** Creates the Format value and links it to the product (product options are linked per value). */
type OptionChange = { product_id: string; product_option_id: string; add: { value: string }[] }

/**
 * Works out every change first: the new Format value, one Pen kit box variant per pen amount
 * (pen price plus the premium, in USD) and the updated contents. Products that
 * already have the box are skipped, so the step can be repeated.
 */
const planPenKitBoxesStep = createStep(
  "plan-pen-kit-boxes",
  async (_input: Record<string, never>, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const catalog = DUAL_CHAMBER_PRODUCTS.filter((product) => !(PEN_KIT_BOX.excluded as readonly string[]).includes(product.handle))
    const { data } = await query.graph({ entity: "product", fields: ["id", "handle", "metadata", "options.id", "options.title", "options.values.value"], filters: { handle: catalog.map((product) => product.handle) } })
    const rows = data as unknown as ProductRow[]
    const pending = catalog.filter((product) => rows.find((row) => row.handle === product.handle)?.metadata?.pen_kit_box_revision !== PEN_KIT_BOX.revision)

    const skus = pending.flatMap((product) => product.pen.map((offer) => boxSku(product, offer.amount)))
    if (skus.length) {
      const { data: clashes } = await query.graph({ entity: "product_variant", fields: ["sku"], filters: { sku: skus } })
      if (clashes.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, `SKU ${clashes[0].sku} already exists.`)
    }

    const options: OptionChange[] = []
    const variants: CreateProductVariantWorkflowInputDTO[] = []
    const updates: UpsertProductDTO[] = []
    for (const product of pending) {
      const row = rows.find((item) => item.handle === product.handle)
      const format = row?.options?.find((option) => option.title === "Format")
      if (!row || !format) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Import the dual-chamber catalog first: ${product.handle}`)
      const previous = (format.values ?? []).map((value) => value.value)
      if (!previous.includes(PEN_KIT_BOX.title)) options.push({ product_id: row.id, product_option_id: format.id, add: [{ value: PEN_KIT_BOX.title }] })
      variants.push(...product.pen.map((offer) => ({
        product_id: row.id,
        title: `${PEN_KIT_BOX.title} · ${offer.amount}`,
        sku: boxSku(product, offer.amount),
        manage_inventory: false,
        allow_backorder: false,
        options: { Format: PEN_KIT_BOX.title, Amount: offer.amount },
        prices: usdPrice(offer.usd + PEN_KIT_BOX.premium),
        metadata: { format: "box" },
      })))
      updates.push({
        id: row.id,
        metadata: {
          ...(row.metadata ?? {}),
          contents_pen: product.contents?.pen ?? FORMAT_CONTENTS.pen,
          contents_box: PEN_KIT_BOX.contents,
          pen_kit_box_revision: PEN_KIT_BOX.revision,
        },
      })
    }
    return new StepResponse({ options, variants, updates, summary: { added: pending.map((product) => product.handle), variants: variants.length } })
  }
)

/** The third format on every dual-chamber product: the complete kit in the VETUD box. */
export const addPenKitBoxesWorkflow = createWorkflow(
  "add-pen-kit-boxes",
  function (input: Record<string, never>) {
    const plan = planPenKitBoxesStep(input)
    updateProductOptionValuesOnProductStep(transform(plan, (data) => data.options))
    when("has-pen-kit-box-variants", plan, (data) => data.variants.length > 0).then(() => {
      createProductVariantsWorkflow.runAsStep({ input: transform(plan, (data) => ({ product_variants: data.variants })) })
      updateProductsWorkflow.runAsStep({ input: transform(plan, (data) => ({ products: data.updates })) })
    })
    return new WorkflowResponse(transform(plan, (data) => data.summary))
  }
)
