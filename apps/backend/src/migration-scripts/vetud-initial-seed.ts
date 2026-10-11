import type { MedusaContainer } from "@medusajs/framework/types"
import { seedVetudStore } from "../seed/seed-store"

/**
 * Runs once per database during `medusa db:migrate` (locally and on Railway's predeploy),
 * so a fresh environment comes up with regions, shipping and the placeholder catalog.
 */
export default async function vetudInitialSeed({
  container,
}: {
  container: MedusaContainer
}) {
  await seedVetudStore(container)
}
