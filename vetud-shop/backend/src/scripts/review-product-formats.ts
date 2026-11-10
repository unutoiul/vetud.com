import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { isUnverifiedInjectionFormat } from "../lib/product-format-review"
import { reviewProductFormatsWorkflow } from "../workflows/review-product-formats"
import { gzipSync } from "node:zlib"

const fields = ["id", "handle", "title", "subtitle", "status", "description", "metadata", "thumbnail", "images.url", "variants.id", "variants.title", "variants.sku", "variants.options.value", "variants.options.option.title", "variants.price_set.id", "variants.price_set.prices.id", "variants.price_set.prices.currency_code", "variants.price_set.prices.amount", "variants.price_set.prices.price_list_id"]
type Product = { handle: string; variants?: { id: string; options?: { value: string; option?: { title: string } }[] }[] }

async function emitSnapshot(name: string, value: unknown) {
  const encoded = gzipSync(Buffer.from(JSON.stringify(value))).toString("base64")
  const chunks = encoded.match(/.{1,4000}/g) ?? []
  for (const [index, chunk] of chunks.entries()) {
    await new Promise<void>((resolve, reject) => process.stdout.write(`${name}_CHUNK ${index} ${chunk}\n`, error => error ? reject(error) : resolve()))
  }
  await new Promise<void>((resolve, reject) => process.stdout.write(`${name}_DONE ${chunks.length}\n`, error => error ? reject(error) : resolve()))
}

export default async function reviewProductFormats({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "product", fields, filters: { status: "published" } })
  const products = data as unknown as Product[]
  const ids = products.filter(product => product.handle === "decapeptide-12").flatMap(product => (product.variants ?? []).filter(variant => isUnverifiedInjectionFormat(variant.options?.find(option => option.option?.title === "Format")?.value ?? "")).map(variant => variant.id))
  const { data: decapeptide } = await query.graph({ entity: "product", fields: ["id", "handle", "status", "metadata"], filters: { handle: "decapeptide-12" } })
  await emitSnapshot("VETUD_FORMAT_SNAPSHOT", { products: data, decapeptide, unsupported_variant_ids: ids })
  if (process.env.VETUD_FORMAT_REVIEW_APPLY !== "true") return
  const expectedVariantIds = JSON.parse(process.env.VETUD_FORMAT_REVIEW_EXPECTED_IDS ?? "[]") as string[]
  const { result } = await reviewProductFormatsWorkflow(container).run({ input: { expectedVariantIds } })
  const { data: after } = await query.graph({ entity: "product", fields, filters: { status: "published" } })
  console.log(`VETUD_FORMAT_RESULT ${JSON.stringify(result)}`)
  await emitSnapshot("VETUD_FORMAT_AFTER", { products: after })
}
