import type { UpsertProductDTO } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateProductsWorkflow, updateProductVariantsWorkflow } from "@medusajs/medusa/core-flows"
import { boxFormat, DUAL_CHAMBER_PRODUCTS, FORMAT_CONTENTS, FORMATS, PEN_KIT_BOX } from "../seed/dual-chamber-catalog"

/** The name the cartridge format had before 2026-11-04. */
const OLD_NAME = "Dual-chamber pen"

type ProductRow = {
  id: string
  handle: string
  metadata?: Record<string, unknown> | null
  options?: { title: string; values?: { id: string; value: string }[] }[]
  variants?: { id: string; title: string }[]
}

/**
 * The owner's format names (2026-11-04): the cartridge on its own is a "Dual-chamber vial", and the
 * reusable pen comes in the Pen kit box. Works out the renamed option values, variant titles and
 * contents; products already renamed are skipped.
 */
const planDualChamberVialRenameStep = createStep(
  "plan-dual-chamber-vial-rename",
  async (_input: Record<string, never>, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "product",
      fields: ["id", "handle", "metadata", "options.title", "options.values.id", "options.values.value", "variants.id", "variants.title"],
      filters: { handle: DUAL_CHAMBER_PRODUCTS.map((product) => product.handle) },
    })
    const values: { id: string; value: string }[] = []
    const variants: { id: string; title: string }[] = []
    const updates: UpsertProductDTO[] = []
    for (const row of data as unknown as ProductRow[]) {
      const product = DUAL_CHAMBER_PRODUCTS.find((item) => item.handle === row.handle)!
      const format = row.options?.find((option) => option.title === "Format")
      const old = format?.values?.find((value) => value.value === OLD_NAME)
      if (old) values.push({ id: old.id, value: FORMATS.pen })
      for (const variant of row.variants ?? []) {
        if (variant.title.startsWith(`${OLD_NAME} · `)) variants.push({ id: variant.id, title: variant.title.replace(OLD_NAME, FORMATS.pen) })
      }
      const boxed = !(PEN_KIT_BOX.excluded as readonly string[]).includes(row.handle)
      // Selank and Semax have the nasal spray in place of the pen kit box.
      const box = boxFormat(row.handle)
      const contents = {
        form: boxed ? box.form : "Dual-chamber vial or vial",
        contents_pen: product.contents?.pen ?? FORMAT_CONTENTS.pen,
        ...(boxed ? { contents_box: box.contents } : {}),
      }
      if (Object.entries(contents).some(([key, value]) => row.metadata?.[key] !== value)) updates.push({ id: row.id, metadata: { ...(row.metadata ?? {}), ...contents } })
    }
    return new StepResponse({ values, variants, updates, summary: { values: values.length, variants: variants.length, products: updates.length } })
  }
)

/** Renames option values in place (variants keep their links); compensation restores the old names. */
const renameDualChamberOptionValuesStep = createStep(
  "rename-dual-chamber-option-values",
  async (values: { id: string; value: string }[], { container }) => {
    const productModule = container.resolve(Modules.PRODUCT)
    for (const value of values) await productModule.updateProductOptionValues(value.id, { value: value.value })
    return new StepResponse(values.length, values)
  },
  async (values, { container }) => {
    if (!values?.length) return
    const productModule = container.resolve(Modules.PRODUCT)
    for (const value of values) await productModule.updateProductOptionValues(value.id, { value: OLD_NAME })
  }
)

export const renameDualChamberVialWorkflow = createWorkflow(
  "rename-dual-chamber-vial",
  function (input: Record<string, never>) {
    const plan = planDualChamberVialRenameStep(input)
    renameDualChamberOptionValuesStep(transform(plan, (data) => data.values))
    when("has-renamed-variants", plan, (data) => data.variants.length > 0).then(() => {
      updateProductVariantsWorkflow.runAsStep({ input: transform(plan, (data) => ({ product_variants: data.variants })) })
    })
    when("has-new-contents", plan, (data) => data.updates.length > 0).then(() => {
      updateProductsWorkflow.runAsStep({ input: transform(plan, (data) => ({ products: data.updates })) })
    })
    return new WorkflowResponse(transform(plan, (data) => data.summary))
  }
)
