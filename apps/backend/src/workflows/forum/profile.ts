import { MedusaError } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { containsDose, containsLink } from "../../lib/forum/moderation"
import type { ProfileRecord } from "../../lib/forum/public"
import { DISPLAY_NAME_PATTERN, handleFor, isReservedHandle, normalizeBody, normalizeTitle } from "../../lib/forum/text"
import { findProfile, forumService } from "./shared"

type SaveForumProfileInput = { customer_id: string; display_name: string; bio?: string | null }
type ProfileFields = { display_name: string; handle: string; bio: string | null }
type ProfileUndo = { id: string; previous: ProfileFields | null }

const prepareForumProfileStep = createStep(
  "prepare-forum-profile",
  async (input: SaveForumProfileInput, { container }) => {
    const service = forumService(container)
    const displayName = normalizeTitle(input.display_name)
    if (!DISPLAY_NAME_PATTERN.test(displayName)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Community names are 3 to 32 characters: letters, numbers, spaces, dots, dashes or apostrophes.")
    }
    const existing = await findProfile(service, input.customer_id)
    // Renaming to the same name keeps the handle (and the member's URL).
    const handle = existing && existing.display_name === displayName ? existing.handle : handleFor(displayName)
    if (isReservedHandle(handle)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "That name isn't available. Please choose another.")
    }
    const [taken] = await service.listForumProfiles({ handle }, { take: 1 })
    if (taken && taken.id !== existing?.id) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "That name is already taken. Please choose another.")
    }
    const bio = input.bio === undefined ? existing?.bio ?? null : normalizeBody(input.bio ?? "") || null
    if (bio && (containsDose(bio) || containsLink(bio))) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Please leave dose amounts and links out of your bio.")
    }
    return new StepResponse({ customer_id: input.customer_id, existing: existing ?? null, fields: { display_name: displayName, handle, bio } })
  }
)

const saveForumProfileStep = createStep(
  "save-forum-profile",
  async (input: { customer_id: string; existing: ProfileRecord | null; fields: ProfileFields }, { container }) => {
    const service = forumService(container)
    if (input.existing) {
      const { display_name, handle, bio } = input.existing
      const profile = await service.updateForumProfiles({ id: input.existing.id, ...input.fields })
      const undo: ProfileUndo = { id: input.existing.id, previous: { display_name, handle, bio: bio ?? null } }
      return new StepResponse(profile, undo)
    }
    // Creating the profile is how a member accepts the community guidelines.
    const profile = await service.createForumProfiles({ customer_id: input.customer_id, ...input.fields, guidelines_accepted_at: new Date() })
    const undo: ProfileUndo = { id: profile.id, previous: null }
    return new StepResponse(profile, undo)
  },
  async (undo: ProfileUndo | undefined, { container }) => {
    if (!undo) return
    const service = forumService(container)
    if (undo.previous) await service.updateForumProfiles({ id: undo.id, ...undo.previous })
    else await service.deleteForumProfiles(undo.id)
  }
)

/** Creates the signed-in customer's community profile, or renames it. */
export const saveForumProfileWorkflow = createWorkflow(
  "save-forum-profile",
  function (input: SaveForumProfileInput) {
    const prepared = prepareForumProfileStep(input)
    const profile = saveForumProfileStep(prepared)
    return new WorkflowResponse(profile)
  }
)
