import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { BESLIMNOW_MODULE } from "../modules/beslimnow"
import type BeslimnowModuleService from "../modules/beslimnow/service"

/**
 * Saves rows sent by the BeSlimNow pen page (be-slim-now/), which shares this database but runs on
 * Vercel. The page posts to /beslimnow/orders and /beslimnow/subscribers with BESLIMNOW_API_SECRET.
 */

export type SaveBeslimnowOrderInput = {
  order_number: string
  placed_at: string
  product: "tz2" | "retatrutide"
  strength: "20mg" | "40mg"
  quantity: number
  currency: string
  unit_regular: number
  unit_price: number
  regular_total: number
  subtotal: number
  code_discount: number
  total: number
  promo_code?: string | null
  name: string
  email: string
  phone: string
  contact_app: string
  contact_handle?: string | null
  country: string
  address: string
  city: string
  postal_code: string
  note?: string | null
  research_use_confirmed: boolean
  confirmation_sent: boolean
}

const createBeslimnowOrderStep = createStep(
  "create-beslimnow-order",
  async (input: SaveBeslimnowOrderInput, { container }) => {
    const service = container.resolve<BeslimnowModuleService>(BESLIMNOW_MODULE)
    const order = await service.createBeslimnowOrders({
      ...input,
      source: "beslimnow",
      placed_at: new Date(input.placed_at),
      email: input.email.trim().toLowerCase(),
    })
    return new StepResponse({ id: order.id, order_number: order.order_number }, order.id)
  },
  async (id, { container }) => {
    if (!id) return
    await container.resolve<BeslimnowModuleService>(BESLIMNOW_MODULE).deleteBeslimnowOrders(id)
  },
)

export const saveBeslimnowOrderWorkflow = createWorkflow(
  "save-beslimnow-order",
  function (input: SaveBeslimnowOrderInput) {
    return new WorkflowResponse(createBeslimnowOrderStep(input))
  },
)

export type SaveBeslimnowSubscriberInput = { email: string; country?: string | null; signup_form?: string }

type SubscriberUndo = {
  id: string
  previous: { last_seen_at: Date; times_subscribed: number; country: string | null } | null
}

/** One row per address; asking again only updates last_seen_at, times_subscribed and country. */
const upsertBeslimnowSubscriberStep = createStep(
  "upsert-beslimnow-subscriber",
  async (input: SaveBeslimnowSubscriberInput, { container }) => {
    const service = container.resolve<BeslimnowModuleService>(BESLIMNOW_MODULE)
    const email = input.email.trim().toLowerCase()
    const country = input.country ? input.country.toUpperCase() : null
    const now = new Date()
    const [existing] = await service.listBeslimnowSubscribers({ email })

    if (existing) {
      await service.updateBeslimnowSubscribers({
        id: existing.id,
        last_seen_at: now,
        times_subscribed: existing.times_subscribed + 1,
        country: country ?? existing.country,
      })
      const undo: SubscriberUndo = {
        id: existing.id,
        previous: {
          last_seen_at: existing.last_seen_at,
          times_subscribed: existing.times_subscribed,
          country: existing.country,
        },
      }
      return new StepResponse({ id: existing.id, is_new: false }, undo)
    }

    const created = await service.createBeslimnowSubscribers({
      source: "beslimnow",
      email,
      country,
      signup_form: input.signup_form || "promo-popup",
      subscribed_at: now,
      last_seen_at: now,
      times_subscribed: 1,
    })
    const undo: SubscriberUndo = { id: created.id, previous: null }
    return new StepResponse({ id: created.id, is_new: true }, undo)
  },
  async (undo, { container }) => {
    if (!undo) return
    const service = container.resolve<BeslimnowModuleService>(BESLIMNOW_MODULE)
    if (undo.previous) await service.updateBeslimnowSubscribers({ id: undo.id, ...undo.previous })
    else await service.deleteBeslimnowSubscribers(undo.id)
  },
)

export const saveBeslimnowSubscriberWorkflow = createWorkflow(
  "save-beslimnow-subscriber",
  function (input: SaveBeslimnowSubscriberInput) {
    return new WorkflowResponse(upsertBeslimnowSubscriberStep(input))
  },
)
