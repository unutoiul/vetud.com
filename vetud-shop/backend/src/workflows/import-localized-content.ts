import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { validateContentBundle, type ReviewedContentInput } from "../lib/localized-content"
import { LOCALIZED_CONTENT_MODULE } from "../modules/localized-content"
import type LocalizedContentModuleService from "../modules/localized-content/service"

const importContentBundleStep = createStep(
  "import-content-bundle",
  async (input: ReviewedContentInput, { container }) => {
    const data = validateContentBundle(input)
    const service = container.resolve<LocalizedContentModuleService>(LOCALIZED_CONTENT_MODULE)
    const [previous] = await service.listContentBundles({ locale: data.locale }, { take: 1 })
    const bundle = previous
      ? await service.updateContentBundles({ id: previous.id, ...data })
      : await service.createContentBundles(data)
    return new StepResponse({ id: bundle.id, locale: bundle.locale, entry_count: bundle.entry_count }, { id: bundle.id, previous })
  },
  async (saved, { container }) => {
    if (!saved) return
    const service = container.resolve<LocalizedContentModuleService>(LOCALIZED_CONTENT_MODULE)
    if (saved.previous) {
      const { id, locale, source_hash, sources, translations, public_translations, entry_count, review } = saved.previous
      await service.updateContentBundles({ id, locale, source_hash, sources, translations, public_translations, entry_count, review })
    } else {
      await service.deleteContentBundles(saved.id)
    }
  }
)

export const importLocalizedContentWorkflow = createWorkflow(
  "import-localized-content",
  function (input: ReviewedContentInput) {
    const imported = importContentBundleStep(input)
    return new WorkflowResponse(imported)
  }
)
