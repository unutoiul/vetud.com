import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { recountForumReputationStep } from "./shared"

/** Recounts reputation for the given members, e.g. after the scoring rules change. */
export const recountForumReputationWorkflow = createWorkflow(
  "recount-forum-reputation",
  function (input: { profile_ids: string[] }) {
    recountForumReputationStep({ profile_ids: input.profile_ids })
    return new WorkflowResponse(input.profile_ids)
  }
)
