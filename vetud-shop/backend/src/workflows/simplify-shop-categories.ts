import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createProductCategoriesWorkflow, updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { FORMAT_CATEGORIES, SHOP_CATEGORIES, SHOP_CATEGORY_MOVES, shopCategoryDescription } from "../seed/shop-categories"

type CategoryRow = { id: string; handle: string; name: string; description?: string | null; rank?: number | null; metadata?: Record<string, unknown> | null }
type CategoryChange = { id: string; name: string; description: string; rank: number; metadata: Record<string, unknown> }
type TargetCategory = { handle: string; name: string; description: string; rank: number; group: string }

/** Works out what differs from the target scheme; nothing is written here. */
const planShopCategoriesStep = createStep(
  "plan-shop-categories",
  async (_input: Record<string, never>, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const handles = [...SHOP_CATEGORIES.map((category) => category.handle), ...FORMAT_CATEGORIES]
    const [{ data: rows }, { data: products }] = await Promise.all([
      query.graph({ entity: "product_category", fields: ["id", "handle", "name", "description", "rank", "metadata"], filters: { handle: handles } }),
      query.graph({ entity: "product", fields: ["id", "handle", "categories.id"], filters: { handle: SHOP_CATEGORY_MOVES.map((move) => move.product) } }),
    ])
    const categories = rows as CategoryRow[]
    const byHandle = new Map(categories.map((category) => [category.handle, category]))

    const target: TargetCategory[] = [
      ...SHOP_CATEGORIES.map((category, rank) => ({ handle: category.handle, name: category.name, description: shopCategoryDescription(category.name), rank, group: "theme" })),
      ...FORMAT_CATEGORIES.flatMap((handle, index) => {
        const current = byHandle.get(handle)
        return current ? [{ handle, name: current.name, description: current.description ?? "", rank: SHOP_CATEGORIES.length + index, group: "format" }] : []
      }),
    ]
    const changes: (CategoryChange & { previous: Omit<CategoryChange, "id"> })[] = []
    const missing: { name: string; handle: string; description: string; rank: number; is_active: boolean; is_internal: boolean; metadata: Record<string, unknown> }[] = []
    for (const item of target) {
      const current = byHandle.get(item.handle)
      const metadata = { ...(current?.metadata ?? {}), storefront_group: item.group }
      if (!current) {
        missing.push({ name: item.name, handle: item.handle, description: item.description, rank: item.rank, is_active: true, is_internal: false, metadata })
      } else if (current.name !== item.name || (current.description ?? "") !== item.description || current.rank !== item.rank || current.metadata?.storefront_group !== item.group) {
        changes.push({
          id: current.id, name: item.name, description: item.description, rank: item.rank, metadata,
          previous: { name: current.name, description: current.description ?? "", rank: current.rank ?? 0, metadata: current.metadata ?? {} },
        })
      }
    }

    const moves = SHOP_CATEGORY_MOVES.flatMap((move) => {
      const product = products.find((row) => row.handle === move.product)
      if (!product) return []
      const from = byHandle.get(move.from)
      const to = byHandle.get(move.to)
      if (!from || !to) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Missing category for ${move.product}: ${!from ? move.from : move.to}`)
      const current = (product.categories ?? []).flatMap((category) => category ? [category.id] : [])
      const next = [...new Set([...current.filter((id) => id !== from.id), to.id])]
      return next.length === current.length && next.every((id) => current.includes(id)) ? [] : [{ id: product.id, handle: move.product, category_ids: next }]
    })

    return new StepResponse({ changes, missing, moves, target })
  }
)

/**
 * Writes every target category in ascending rank order. Medusa shifts siblings when a rank changes,
 * so assigning ranks 0, 1, 2… in one pass is what makes the final order come out right.
 * Restores the previous values if a later step fails.
 */
const applyCategoryChangesStep = createStep(
  "apply-category-changes",
  async (targets: TargetCategory[], { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const productModule = container.resolve(Modules.PRODUCT)
    const { data } = await query.graph({ entity: "product_category", fields: ["id", "handle", "name", "description", "rank", "metadata"], filters: { handle: targets.map((target) => target.handle) } })
    const rows = data as CategoryRow[]
    const previous: CategoryChange[] = []
    for (const target of [...targets].sort((a, b) => a.rank - b.rank)) {
      const current = rows.find((row) => row.handle === target.handle)
      if (!current) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Missing category: ${target.handle}`)
      previous.push({ id: current.id, name: current.name, description: current.description ?? "", rank: current.rank ?? 0, metadata: current.metadata ?? {} })
      await productModule.updateProductCategories(current.id, { name: target.name, description: target.description, rank: target.rank, metadata: { ...(current.metadata ?? {}), storefront_group: target.group } })
    }
    return new StepResponse(targets.map((target) => target.handle), previous)
  },
  async (previous, { container }) => {
    if (!previous?.length) return
    const productModule = container.resolve(Modules.PRODUCT)
    for (const { id, ...values } of previous) await productModule.updateProductCategories(id, values)
  }
)

/** Brings the shop categories to the simplified scheme. Safe to run again: it only changes what differs. */
export const simplifyShopCategoriesWorkflow = createWorkflow(
  "simplify-shop-categories",
  (input: Record<string, never>) => {
    const plan = planShopCategoriesStep(input)
    when("has-new-shop-categories", plan, (data) => data.missing.length > 0).then(() =>
      createProductCategoriesWorkflow.runAsStep({ input: transform(plan, (data) => ({ product_categories: data.missing })) })
    )
    when("has-shop-category-changes", plan, (data) => data.missing.length > 0 || data.changes.length > 0).then(() => {
      applyCategoryChangesStep(transform(plan, (data) => data.target))
    })
    when("has-shop-category-moves", plan, (data) => data.moves.length > 0).then(() =>
      updateProductsWorkflow.runAsStep({ input: transform(plan, (data) => ({ products: data.moves.map(({ id, category_ids }) => ({ id, category_ids })) })) })
    )
    return new WorkflowResponse(transform(plan, (data) => ({
      created: data.missing.map((category) => category.handle),
      renamed: data.changes.map((change) => `${change.previous.name} → ${change.name}`),
      moved: data.moves.map((move) => move.handle),
    })))
  }
)
