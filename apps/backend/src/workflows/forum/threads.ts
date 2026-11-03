import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { validateMeasurements, type MeasurementInput } from "../../lib/forum/metrics"
import { screenPost } from "../../lib/forum/moderation"
import { hasPaidOrderFor, matchLot, type OrderForPurchaseCheck } from "../../lib/forum/purchase"
import { excerptOf, normalizeBody, normalizeTitle, slugify } from "../../lib/forum/text"
import { activeProfile, assertNotTooSoon, forumService, recountForumReputationStep } from "./shared"

export type ThreadKind = "discussion" | "question" | "research_log"

export type CreateForumThreadInput = {
  customer_id: string
  kind: ThreadKind
  title: string
  body: string
  peptide_slug?: string | null
  other_peptides?: string[]
  product_handle?: string | null
  lot?: string | null
  unit_system?: "metric" | "imperial"
  side_effects?: string[]
  measurements?: MeasurementInput[]
}

/** One new thread per member per interval. */
const THREAD_INTERVAL_MS = 2 * 60 * 1000

type PreparedThread = {
  profile_id: string
  thread: {
    author_id: string
    kind: ThreadKind
    title: string
    slug: string
    excerpt: string
    peptide_slug: string | null
    other_peptides: string[]
    product_handle: string | null
    lot: string | null
    verified_purchase: boolean
    status: "published" | "pending"
    hold_reason: string | null
    unit_system: "metric" | "imperial"
    side_effects: string[]
  }
  body: string
  measurements: MeasurementInput[]
}

async function findProduct(container: MedusaContainer, handle: string) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "product", fields: ["id", "handle", "metadata"], filters: { handle } })
  return data[0] as { id: string; handle: string; metadata?: Record<string, unknown> | null } | undefined
}

async function hasPurchased(container: MedusaContainer, customerId: string, productId: string) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "status", "is_draft_order", "items.product_id", "payment_collections.payments.captured_at"],
    filters: { customer_id: customerId },
  })
  return hasPaidOrderFor(data as OrderForPurchaseCheck[], productId)
}

const prepareForumThreadStep = createStep(
  "prepare-forum-thread",
  async (input: CreateForumThreadInput, { container }) => {
    const service = forumService(container)
    const profile = await activeProfile(service, input.customer_id)
    const [latest] = await service.listForumThreads({ author_id: profile.id }, { take: 1, order: { created_at: "DESC" }, withDeleted: true })
    assertNotTooSoon(latest, THREAD_INTERVAL_MS, "You're starting threads too quickly. Please wait a couple of minutes and try again.")

    const title = normalizeTitle(input.title)
    const body = normalizeBody(input.body)
    if (title.length < 8) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Please give your thread a clearer title.")
    if (body.length < 20) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Please write a little more, so others can help.")

    const isLog = input.kind === "research_log"
    if (isLog && !input.peptide_slug) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Choose the peptide this log is about.")
    if (!isLog && (input.measurements?.length || input.side_effects?.length)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Only research logs include measurements.")
    }
    // Week 0 is the starting point; a log can also include where the member is now.
    const measurements = isLog ? validateMeasurements(input.measurements ?? [], { requireBaseline: true }) : []
    const sideEffects = [...new Set((input.side_effects ?? []).map(normalizeTitle).filter(Boolean))]
    const peptide = input.peptide_slug ?? null
    const otherPeptides = [...new Set(input.other_peptides ?? [])].filter(slug => slug !== peptide)

    const product = input.product_handle ? await findProduct(container, input.product_handle) : undefined
    if (input.product_handle && !product) throw new MedusaError(MedusaError.Types.INVALID_DATA, "We couldn't find that product.")
    let lot: string | null = null
    if (input.lot) {
      if (!product) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Choose the product your lot number belongs to.")
      lot = matchLot(product.metadata?.lots, input.lot) ?? null
      if (!lot) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "That lot number isn't on record for this product. Check the number printed on your packaging.")
      }
    }

    const hold = screenPost([title, body, ...sideEffects], profile)
    const prepared: PreparedThread = {
      profile_id: profile.id,
      thread: {
        author_id: profile.id,
        kind: input.kind,
        title,
        slug: slugify(title),
        excerpt: excerptOf(body),
        peptide_slug: peptide,
        other_peptides: otherPeptides,
        product_handle: product?.handle ?? null,
        lot,
        verified_purchase: product ? await hasPurchased(container, input.customer_id, product.id) : false,
        status: hold ? "pending" : "published",
        hold_reason: hold,
        unit_system: input.unit_system ?? "metric",
        side_effects: sideEffects,
      },
      body,
      measurements,
    }
    return new StepResponse(prepared)
  }
)

const createForumThreadStep = createStep(
  "create-forum-thread",
  async (input: PreparedThread, { container }) => {
    const service = forumService(container)
    const thread = await service.createForumThreads({ ...input.thread, last_activity_at: new Date() })
    const post = await service.createForumPosts({
      thread_id: thread.id,
      author_id: input.profile_id,
      body: input.body,
      is_opening: true,
      status: input.thread.status,
      hold_reason: input.thread.hold_reason,
    })
    const measurements = input.measurements.length
      ? await service.createForumLogMeasurements(input.measurements.map(measurement => ({ ...measurement, thread_id: thread.id, post_id: post.id })))
      : []
    return new StepResponse({ thread, post }, { thread_id: thread.id, post_id: post.id, measurement_ids: measurements.map(measurement => measurement.id) })
  },
  async (created, { container }) => {
    if (!created) return
    const service = forumService(container)
    if (created.measurement_ids.length) await service.deleteForumLogMeasurements(created.measurement_ids)
    await service.deleteForumPosts(created.post_id)
    await service.deleteForumThreads(created.thread_id)
  }
)

/**
 * Starts a discussion, question or research log as the signed-in member. Posts with dose amounts
 * (or a new member's links) wait for review; everything else is published straight away.
 */
export const createForumThreadWorkflow = createWorkflow(
  "create-forum-thread",
  function (input: CreateForumThreadInput) {
    const prepared = prepareForumThreadStep(input)
    const created = createForumThreadStep(prepared)
    const profileIds = transform({ prepared }, ({ prepared }) => [prepared.profile_id])
    // A published research log earns reputation.
    recountForumReputationStep({ profile_ids: profileIds })
    return new WorkflowResponse(created)
  }
)
