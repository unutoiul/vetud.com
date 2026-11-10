import type { UpsertProductDTO } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateProductsWorkflow, updateProductVariantsWorkflow } from "@medusajs/medusa/core-flows"
import { boxFormat, NASAL_SPRAY, PEN_KIT_BOX } from "../seed/dual-chamber-catalog"

type ProductRow = {
  id: string
  handle: string
  metadata?: Record<string, unknown> | null
  options?: { title: string; is_exclusive?: boolean; values?: { id: string; value: string }[] }[]
  variants?: { id: string; title: string }[]
}

/**
 * Selank and Semax (2026-11-05): their "Pen kit box" format becomes "Nasal spray". Works out the
 * renamed option values, variant titles and contents; products already renamed are skipped.
 * Prices, SKUs and stock stay as they are.
 */
const planNasalSprayRenameStep = createStep(
  "plan-nasal-spray-rename",
  async (_input: Record<string, never>, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "product",
      fields: ["id", "handle", "metadata", "options.title", "options.is_exclusive", "options.values.id", "options.values.value", "variants.id", "variants.title"],
      filters: { handle: [...NASAL_SPRAY.handles] },
    })
    const values: { id: string; value: string }[] = []
    const variants: { id: string; title: string }[] = []
    const updates: UpsertProductDTO[] = []
    for (const row of data as unknown as ProductRow[]) {
      const format = row.options?.find((option) => option.title === "Format")
      const old = format?.values?.find((value) => value.value === PEN_KIT_BOX.title)
      if (old) {
        // A shared option's value belongs to every product using it; only this product's own may be renamed.
        if (!format?.is_exclusive) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `The Format option of ${row.handle} is shared with other products.`)
        values.push({ id: old.id, value: NASAL_SPRAY.title })
      }
      for (const variant of row.variants ?? []) {
        if (variant.title.startsWith(`${PEN_KIT_BOX.title} · `)) variants.push({ id: variant.id, title: variant.title.replace(PEN_KIT_BOX.title, NASAL_SPRAY.title) })
      }
      const box = boxFormat(row.handle)
      const contents = { form: box.form, contents_box: box.contents, nasal_spray_revision: NASAL_SPRAY.revision }
      if (Object.entries(contents).some(([key, value]) => row.metadata?.[key] !== value)) updates.push({ id: row.id, metadata: { ...(row.metadata ?? {}), ...contents } })
    }
    return new StepResponse({ values, variants, updates, summary: { values: values.length, variants: variants.length, products: updates.length } })
  }
)

/** Renames option values in place (variants keep their links); compensation restores "Pen kit box". */
const renameNasalSprayOptionValuesStep = createStep(
  "rename-nasal-spray-option-values",
  async (values: { id: string; value: string }[], { container }) => {
    const productModule = container.resolve(Modules.PRODUCT)
    for (const value of values) await productModule.updateProductOptionValues(value.id, { value: value.value })
    return new StepResponse(values.length, values)
  },
  async (values, { container }) => {
    if (!values?.length) return
    const productModule = container.resolve(Modules.PRODUCT)
    for (const value of values) await productModule.updateProductOptionValues(value.id, { value: PEN_KIT_BOX.title })
  }
)

export const renameNasalSprayFormatWorkflow = createWorkflow(
  "rename-nasal-spray-format",
  function (input: Record<string, never>) {
    const plan = planNasalSprayRenameStep(input)
    renameNasalSprayOptionValuesStep(transform(plan, (data) => data.values))
    when("has-renamed-spray-variants", plan, (data) => data.variants.length > 0).then(() => {
      updateProductVariantsWorkflow.runAsStep({ input: transform(plan, (data) => ({ product_variants: data.variants })) })
    })
    when("has-new-spray-contents", plan, (data) => data.updates.length > 0).then(() => {
      updateProductsWorkflow.runAsStep({ input: transform(plan, (data) => ({ products: data.updates })) })
    })
    return new WorkflowResponse(transform(plan, (data) => data.summary))
  }
)
