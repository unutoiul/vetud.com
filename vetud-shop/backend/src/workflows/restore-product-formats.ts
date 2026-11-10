import type { IProductModuleService, UpsertProductDTO } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { restoredFormatMetadata, restoredPackagingDescription, variantPriceDigest, type PriceVariant, type RestoreProduct } from "../lib/product-format-restore"

export const RESTORE_FIELDS = ["id", "handle", "title", "subtitle", "status", "description", "metadata", "thumbnail", "images.url", "variants.id", "variants.title", "variants.sku", "variants.options.value", "variants.options.option.title", "variants.price_set.id", "variants.price_set.prices.id", "variants.price_set.prices.currency_code", "variants.price_set.prices.amount", "variants.price_set.prices.price_list_id"]
type Product = { id: string; handle: string; description?: string | null; metadata?: Record<string, unknown> | null; variants?: PriceVariant[] }
type Input = { products: RestoreProduct[]; variantIds: string[] }

const planOriginalProductFormatRestore = createStep("plan-original-product-format-restore", async (input: Input, { container }) => {
  if (input.variantIds.length !== 99 || new Set(input.variantIds).size !== 99) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Expected the original 99 removed variant IDs")
  if (input.products.some(product => product.handle === "decapeptide-12")) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Decapeptide-12 must remain excluded")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "product", fields: RESTORE_FIELDS, filters: { status: "published" } })
  const before = data as unknown as Product[]
  const service = container.resolve<IProductModuleService>(Modules.PRODUCT)
  const records = await service.listProductVariants({ id: input.variantIds }, { withDeleted: true, take: input.variantIds.length })
  const rows = records as unknown as { id: string; product_id: string; deleted_at?: string | Date | null; manage_inventory?: boolean }[]
  if (rows.length !== input.variantIds.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, "A backed-up variant is missing; no restoration was applied")
  const expected = new Map(input.products.flatMap(product => product.variants.map(variant => [variant.id, product.id])))
  for (const row of rows) {
    if (expected.get(row.id) !== row.product_id) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Variant ownership differs from the backup")
    if (row.manage_inventory) throw new MedusaError(MedusaError.Types.INVALID_DATA, "A restored variant needs an inventory-specific restoration review")
  }
  const updates: UpsertProductDTO[] = input.products.map(source => {
    const current = before.find(product => product.id === source.id && product.handle === source.handle)
    if (!current) throw new MedusaError(MedusaError.Types.INVALID_DATA, `The original product is not published: ${source.handle}`)
    return {
      id: source.id, metadata: restoredFormatMetadata(current.metadata ?? {}, source),
      description: restoredPackagingDescription(current.description ?? "", source.description),
      thumbnail: source.thumbnail, images: source.images,
    }
  })
  return new StepResponse({ ids: rows.filter(row => row.deleted_at).map(row => row.id), updates, before, original: input })
})

const restoreOriginalProductVariants = createStep("restore-original-product-variants", async (ids: string[], { container }) => {
  if (ids.length) await container.resolve<IProductModuleService>(Modules.PRODUCT).restoreProductVariants(ids)
  return new StepResponse(ids, ids)
}, async (ids, { container }) => {
  if (ids?.length) await container.resolve<IProductModuleService>(Modules.PRODUCT).softDeleteProductVariants(ids)
})

const restoreOriginalVariantLinks = createStep("restore-original-variant-links", async (ids: string[], { container }) => {
  if (ids.length) {
    const link = container.resolve(ContainerRegistrationKeys.LINK)
    const grouped = { [Modules.PRODUCT]: { variant_id: ids } }
    const [errors] = await link.restore(grouped)
    if (errors?.length) {
      await link.delete(grouped)
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Variant price links could not all be restored")
    }
  }
  return new StepResponse(ids, ids)
}, async (ids, { container }) => {
  if (ids?.length) await container.resolve(ContainerRegistrationKeys.LINK).delete({ [Modules.PRODUCT]: { variant_id: ids } })
})

const verifyOriginalFormatRestoration = createStep("verify-original-format-restoration", async (input: { plan: { before: Product[]; original: Input; ids: string[] }; completed: unknown }, { container }) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "product", fields: RESTORE_FIELDS, filters: { status: "published" } })
  const after = data as unknown as Product[]
  const active = new Map(after.flatMap(product => (product.variants ?? []).map(variant => [variant.id, variant])))
  for (const product of input.plan.before) for (const variant of product.variants ?? []) {
    const current = active.get(variant.id)
    if (!current || variantPriceDigest(current) !== variantPriceDigest(variant)) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "An existing offer or price changed during restoration")
  }
  for (const source of input.plan.original.products) for (const expected of source.variants) {
    const current = active.get(expected.id)
    if (!current || current.sku !== expected.sku || current.price_set?.id !== expected.priceSetId || variantPriceDigest(current) !== expected.priceDigest) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Original offer or price restoration failed for ${source.handle}`)
    const options = (current.options ?? []).map(option => [option.option?.title ?? "", option.value]).sort((a, b) => a[0].localeCompare(b[0]))
    if (JSON.stringify(options) !== JSON.stringify(expected.options)) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Original format/amount links were not restored for ${source.handle}`)
  }
  const expectedIds = new Set([...input.plan.before.flatMap(product => (product.variants ?? []).map(variant => variant.id)), ...input.plan.original.variantIds])
  if (active.size !== expectedIds.size || [...active.keys()].some(id => !expectedIds.has(id))) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Unexpected catalog variants after restoration")
  return new StepResponse({ restored: input.plan.ids.length, activeVariants: active.size, productsRestored: input.plan.original.products.length, originalPricesVerified: true, products: data })
})

export const restoreProductFormatsWorkflow = createWorkflow("restore-product-formats", function (input: Input) {
  const plan = planOriginalProductFormatRestore(input)
  const restored = restoreOriginalProductVariants(transform(plan, data => data.ids))
  const links = restoreOriginalVariantLinks(restored)
  const updated = updateProductsWorkflow.runAsStep({ input: transform({ plan, links }, data => ({ products: data.plan.updates })) })
  const verified = verifyOriginalFormatRestoration({ plan, completed: updated })
  return new WorkflowResponse(verified)
})
