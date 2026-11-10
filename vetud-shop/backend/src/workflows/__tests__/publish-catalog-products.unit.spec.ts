import { createWorkflow } from "@medusajs/framework/workflows-sdk"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { CATALOG_PUBLICATION_HANDLES } from "../publish-catalog-products"

jest.mock("@medusajs/framework/workflows-sdk", () => ({
  createWorkflow: jest.fn(),
  WorkflowResponse: jest.fn(),
}))

jest.mock("@medusajs/medusa/core-flows", () => ({
  updateProductsWorkflow: { runAsStep: jest.fn() },
}))

it("limits publication to the fixed snapshot, including the nine older drafts", () => {
  expect(CATALOG_PUBLICATION_HANDLES).toEqual([
    "bacteriostatic-water",
    "peptide-series-01",
    "peptide-series-02",
    "peptide-series-03",
    "peptide-series-04",
    "peptide-series-05",
    "peptide-series-06",
    "research-blend-a",
    "research-blend-b",
    "retatrutide",
    "selank",
    "semaglutide",
    "semax",
    "tirzepatide",
  ])
  expect(new Set(CATALOG_PUBLICATION_HANDLES).size).toBe(14)
})

it("uses the core update workflow to change only publication status", () => {
  const compose = (createWorkflow as jest.Mock).mock.calls.find(
    ([name]) => name === "publish-catalog-products"
  )?.[1]
  expect(compose).toEqual(expect.any(Function))
  compose()

  expect(updateProductsWorkflow.runAsStep).toHaveBeenCalledTimes(1)
  expect(updateProductsWorkflow.runAsStep).toHaveBeenCalledWith({
    input: {
      selector: { handle: CATALOG_PUBLICATION_HANDLES },
      update: { status: "published" },
    },
  })
})
