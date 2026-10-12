import type { MedusaContainer } from "@medusajs/framework/types"
import { replaceSeriesOneWithRetatrutide } from "../seed/retatrutide"

/** Runs once per database: turns the placeholder first product into Retatrutide 40 mg. */
export default async function vetudProductRetatrutide({ container }: { container: MedusaContainer }) {
  await replaceSeriesOneWithRetatrutide(container)
}
