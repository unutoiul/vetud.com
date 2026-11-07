import { readFile } from "node:fs/promises"
import type { ExecArgs } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { CONTENT_LOCALES, validateContentBundle, type ReviewedContentInput } from "../lib/localized-content"
import { importLocalizedContentWorkflow } from "../workflows/import-localized-content"

/** Run only with a complete, independently reviewed export in a private file. */
export default async function importLocalizedContent({ container }: ExecArgs) {
  const file = process.env.CONTENT_TRANSLATIONS_FILE
  if (!file) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Set CONTENT_TRANSLATIONS_FILE to the private reviewed export path.")
  const document = JSON.parse(await readFile(file, "utf8")) as { bundles: ReviewedContentInput[] }
  const required = CONTENT_LOCALES.filter(locale => locale !== "en-US")
  const received = document.bundles?.map(bundle => bundle.locale).sort()
  if (JSON.stringify(received) !== JSON.stringify([...required].sort())) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "The import must contain one complete reviewed bundle for every target store locale, including British English.")
  }
  // Validate the entire export before writing the first locale.
  for (const bundle of document.bundles) validateContentBundle(bundle)
  const hashes = new Set(document.bundles.map(bundle => bundle.source_hash))
  if (hashes.size !== 1) throw new MedusaError(MedusaError.Types.INVALID_DATA, "All locales must translate the same source inventory.")
  for (const bundle of document.bundles) {
    const { result } = await importLocalizedContentWorkflow(container).run({ input: bundle })
    console.log(JSON.stringify({ event: "localized_content_imported", ...result }))
  }
}
