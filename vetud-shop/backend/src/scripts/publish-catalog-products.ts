import { resolve } from "node:path"
import { MigrationScriptsMigrator } from "@medusajs/framework/migrations"
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

/** Apply only the catalog publication migration, recording completion to prevent replays. */
export default async function publishCatalogProducts({ container }: ExecArgs) {
  const directory = resolve(__dirname, "../migration-scripts")
  const target = resolve(directory, "vetud-product-15-publish-catalog-products.ts")
  const migrator = new MigrationScriptsMigrator({ container })
  const pending = await migrator.getPendingMigrations([directory])

  if (pending.some((file) => resolve(file) !== target)) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Other application migrations are pending. Review them before publishing the catalog."
    )
  }

  if (!pending.length) {
    container
      .resolve(ContainerRegistrationKeys.LOGGER)
      .info("Catalog publication migration already completed; no changes made.")
    return
  }

  await migrator.run([directory])
}
