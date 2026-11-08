import type { UpsertProductDTO } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { deleteProductVariantsWorkflow, updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { isUnverifiedInjectionFormat, NASAL_RESEARCH_HANDLES, OPTIONAL_VIAL_ACCESSORIES_SCOPE, optionalVialAccessoriesAllowed, PRODUCT_FORMAT_REVIEW, RESEARCH_VIAL_CONTENTS, RESEARCH_WATER_SUBTITLE, reviewedResearchDescription } from "../lib/product-format-review"

type Variant = { id: string; title: string; options?: { value: string; option?: { title: string } }[] }
type Product = {
  id: string; handle: string; title: string; subtitle?: string | null; description?: string | null
  metadata?: Record<string, unknown> | null
  variants?: Variant[]
  images?: { url: string }[]
}
type Input = { expectedVariantIds?: string[] }

const planProductFormatReview = createStep("plan-product-format-review", async (input: Input, { container }) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title", "subtitle", "description", "metadata", "images.url", "variants.id", "variants.title", "variants.options.value", "variants.options.option.title"],
    filters: { status: "published" },
  })
  const variants: string[] = [], products: UpsertProductDTO[] = []
  const summary: { handle: string; removed: number; retained: number }[] = []
  for (const row of data as unknown as Product[]) {
    const offered = row.variants ?? []
    const format = (variant: Variant) => variant.options?.find(option => option.option?.title === "Format")?.value ?? ""
    if (!offered.some(variant => format(variant))) continue
    const unsupported = offered.filter(variant => isUnverifiedInjectionFormat(format(variant)))
    const research = row.metadata?.research_use_only === true || unsupported.length > 0
    const description = reviewedResearchDescription(row.handle, row.description ?? "")
    const subtitle = row.handle === "bacteriostatic-water" ? RESEARCH_WATER_SUBTITLE : row.subtitle
    if (!research || row.metadata?.format_review_revision === PRODUCT_FORMAT_REVIEW && !unsupported.length && row.description === description && row.subtitle === subtitle) continue
    const retained = offered.filter(variant => !unsupported.some(removed => removed.id === variant.id))
    if (!retained.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, `No supported variant would remain for ${row.handle}`)
    const nasal = (NASAL_RESEARCH_HANDLES as readonly string[]).includes(row.handle) && retained.some(variant => format(variant) === "Nasal spray")
    const existing = row.metadata ?? {}
    const metadata = {
      ...existing,
      form: row.handle === "bacteriostatic-water" ? "Bottled laboratory research diluent" : nasal ? "Research vial or nasal spray" : "Research vial",
      contents_pen: null,
      contents_box: nasal ? "VETUD box with one nasal spray bottle. For laboratory research only; not for injection." : null,
      format_line_pen: null,
      format_line_box: nasal ? "Nasal-spray research format. Not for injection." : null,
      contents_vial: row.handle === "bacteriostatic-water" ? "One bottle of laboratory research diluent. Refer to its label for composition and storage." : RESEARCH_VIAL_CONTENTS,
      format_line_vial: row.handle === "bacteriostatic-water" ? "Bottled laboratory research diluent" : "Sealed research vial; no diluent or administration supplies included",
      preparation_addons_allowed: optionalVialAccessoriesAllowed(row.handle) && retained.some(variant => format(variant) === "Vial"),
      preparation_addons_scope: OPTIONAL_VIAL_ACCESSORIES_SCOPE,
      preparation_addons_basis: "Optional laboratory accessories only. The research protocol must specify diluent compatibility and supplies; no injection suitability is established.",
      injection_format_verified: false,
      format_review_revision: PRODUCT_FORMAT_REVIEW,
      format_review_basis: "Manufacturer sterility, endotoxin and cartridge-compatibility documentation not available; owner confirmed 2026-11-09.",
      allowed_formats: [...new Set(retained.map(format).filter(Boolean))],
    }
    const origin = "https://www.vetud.com"
    const urls = [`${origin}/images/products/${row.handle}-vial.webp`, ...(nasal ? [`${origin}/images/products/${row.handle}-front.webp`] : [])]
    products.push({ id: row.id, subtitle, description, metadata, thumbnail: urls[0], images: urls.map(url => ({ url })) })
    variants.push(...unsupported.map(variant => variant.id))
    summary.push({ handle: row.handle, removed: unsupported.length, retained: retained.length })
  }
  if (input.expectedVariantIds && [...input.expectedVariantIds].sort().join() !== [...variants].sort().join()) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "The catalog changed since the reviewed removal plan. Audit it again before applying.")
  }
  return new StepResponse({ variants, products, summary })
})

/** Updates presentation and soft-deletes unsupported variants through the standard Medusa workflows. */
export const reviewProductFormatsWorkflow = createWorkflow("review-product-formats", function (input: Input) {
  const plan = planProductFormatReview(input)
  when("has-product-format-updates", plan, data => data.products.length > 0).then(() => {
    updateProductsWorkflow.runAsStep({ input: transform(plan, data => ({ products: data.products })) })
  })
  when("has-unsupported-product-variants", plan, data => data.variants.length > 0).then(() => {
    deleteProductVariantsWorkflow.runAsStep({ input: transform(plan, data => ({ ids: data.variants })) })
  })
  return new WorkflowResponse(transform(plan, data => ({ products: data.summary, removed_variants: data.variants.length })))
})
