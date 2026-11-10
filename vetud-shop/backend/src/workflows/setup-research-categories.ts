import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createProductCategoriesWorkflow, updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { RESEARCH_CATEGORIES, RESEARCH_CATEGORY_ASSIGNMENTS } from "../seed/research-categories"

const prepareResearchCategoriesStep = createStep(
  "prepare-research-categories",
  async (_input: Record<string, never>, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const [{ data: categories }, { data: products }] = await Promise.all([
      query.graph({ entity: "product_category", fields: ["id", "handle"], filters: { handle: RESEARCH_CATEGORIES.map(category => category.handle) } }),
      query.graph({ entity: "product", fields: ["id", "handle", "categories.id"], filters: { handle: Object.keys(RESEARCH_CATEGORY_ASSIGNMENTS) } }),
    ])
    return new StepResponse({
      categories,
      products,
      missing: RESEARCH_CATEGORIES.flatMap((category, index) => categories.some(existing => existing.handle === category.handle) ? [] : [{
        ...category,
        is_active: true,
        is_internal: false,
        rank: index + 3,
        metadata: { storefront_group: "research" },
      }]),
    })
  }
)

const planResearchAssignmentsStep = createStep(
  "plan-research-assignments",
  async (input: {
    categories: { id: string; handle: string | null }[]
    products: { id: string; handle: string | null; categories?: { id: string }[] | null }[]
  }) => {
    const ids = new Map(input.categories.map(category => [category.handle, category.id]))
    const assignments = input.products.flatMap(product => {
      const previous = (product.categories ?? []).map(category => category.id)
      const required = RESEARCH_CATEGORY_ASSIGNMENTS[product.handle!] ?? []
      const categoryIds = required.map(handle => {
        const id = ids.get(handle)
        if (!id) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Missing research category: ${handle}`)
        return id
      })
      return categoryIds.every(id => previous.includes(id)) ? [] : [{
        id: product.id,
        handle: product.handle,
        category_ids: [...new Set([...previous, ...categoryIds])],
      }]
    })
    return new StepResponse(assignments)
  }
)

/** Adds the eight categories and missing assignments without replacing any existing product categories. */
export const setupResearchCategoriesWorkflow = createWorkflow(
  "setup-research-categories",
  function (input: Record<string, never>) {
    const prepared = prepareResearchCategoriesStep(input)
    const created = when("has-missing-research-categories", prepared, data => data.missing.length > 0).then(() =>
      createProductCategoriesWorkflow.runAsStep({
        input: transform(prepared, data => ({ product_categories: data.missing })),
      })
    )
    const assignments = planResearchAssignmentsStep(transform({ prepared, created }, ({ prepared: data, created: added }) => ({
      categories: [...data.categories, ...(added ?? [])],
      products: data.products.map(product => ({
        id: product.id,
        handle: product.handle,
        categories: (product.categories ?? []).flatMap(category => category ? [{ id: category.id }] : []),
      })),
    })))
    when("has-missing-research-assignments", assignments, products => products.length > 0).then(() =>
      updateProductsWorkflow.runAsStep({
        input: transform(assignments, products => ({ products: products.map(({ id, category_ids }) => ({ id, category_ids })) })),
      })
    )
    return new WorkflowResponse(transform({ prepared, assignments }, ({ prepared: data, assignments: products }) => ({
      created: data.missing.map(category => category.handle),
      assigned: products.map(product => product.handle),
    })))
  }
)
