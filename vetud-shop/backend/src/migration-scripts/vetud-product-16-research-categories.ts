import type { ExecArgs } from "@medusajs/framework/types"
import setupResearchCategories from "../scripts/setup-research-categories"

/** Runs once during deploy; the underlying workflow is also safe to run manually. */
export default async function addResearchCategories(args: ExecArgs) {
  await setupResearchCategories(args)
}
