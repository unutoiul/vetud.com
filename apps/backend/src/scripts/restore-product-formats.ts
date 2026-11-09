import type { ExecArgs, IProductModuleService } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { readFileSync } from "node:fs"
import { gzipSync } from "node:zlib"
import { restoreProductFormatsWorkflow, RESTORE_FIELDS } from "../workflows/restore-product-formats"

async function emit(name: string, value: unknown) {
  const chunks = gzipSync(Buffer.from(JSON.stringify(value))).toString("base64").match(/.{1,4000}/g) ?? []
  for (const [index, chunk] of chunks.entries()) await new Promise<void>((resolve, reject) => process.stdout.write(`${name}_CHUNK ${index} ${chunk}\n`, error => error ? reject(error) : resolve()))
  await new Promise<void>((resolve, reject) => process.stdout.write(`${name}_DONE ${chunks.length}\n`, error => error ? reject(error) : resolve()))
}

export default async function restoreProductFormats({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "product", fields: RESTORE_FIELDS, filters: { status: "published" } })
  await emit("FORMAT_RESTORE_BEFORE", { products: data })
  const input = JSON.parse(readFileSync(process.env.VETUD_RESTORE_INPUT_PATH ?? "", "utf8"))
  const records = await container.resolve<IProductModuleService>(Modules.PRODUCT).listProductVariants({ id: input.variantIds }, { withDeleted: true, take: input.variantIds.length })
  await emit("FORMAT_RESTORE_RECORDS", records.map(record => ({ id: record.id, product_id: record.product_id, manage_inventory: record.manage_inventory, deleted_at: (record as unknown as { deleted_at?: string }).deleted_at })))
  if (process.env.VETUD_RESTORE_FORMATS !== "true") return
  const { result } = await restoreProductFormatsWorkflow(container).run({ input })
  await emit("FORMAT_RESTORE_AFTER", result)
}
