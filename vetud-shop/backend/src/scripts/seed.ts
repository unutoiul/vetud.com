import type { ExecArgs } from "@medusajs/framework/types"
import { seedVetudStore } from "../seed/seed-store"

/**
 * Manual entry point: `npm run seed`. The same seed also runs automatically as a migration
 * script, and it skips itself when the catalog already exists.
 */
export default async function seed({ container }: ExecArgs) {
  await seedVetudStore(container)
}
