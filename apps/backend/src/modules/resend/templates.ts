import { render } from "@react-email/render"
import { createElement, type ComponentType } from "react"
import ContactMessageEmail, { contactMessageSubject } from "./emails/contact-message"
import OrderPlacedEmail, { orderPlacedSubject } from "./emails/order-placed"
import OrderPlacedAdminEmail, { orderPlacedAdminSubject } from "./emails/order-placed-admin"
import ShipmentCreatedEmail, { shipmentCreatedSubject } from "./emails/shipment-created"

export const EmailTemplates = {
  ORDER_PLACED: "order-placed",
  ORDER_PLACED_ADMIN: "order-placed-admin",
  SHIPMENT_CREATED: "shipment-created",
  CONTACT_MESSAGE: "contact-message",
} as const

type TemplateEntry = {
  component: ComponentType<any>
  subject: (data: any) => string
  replyTo?: (data: any) => string | undefined
}

const registry: Record<string, TemplateEntry> = {
  [EmailTemplates.ORDER_PLACED]: { component: OrderPlacedEmail, subject: orderPlacedSubject },
  [EmailTemplates.ORDER_PLACED_ADMIN]: {
    component: OrderPlacedAdminEmail,
    subject: orderPlacedAdminSubject,
  },
  [EmailTemplates.SHIPMENT_CREATED]: {
    component: ShipmentCreatedEmail,
    subject: shipmentCreatedSubject,
  },
  [EmailTemplates.CONTACT_MESSAGE]: {
    component: ContactMessageEmail,
    subject: contactMessageSubject,
    replyTo: (data) => data.email,
  },
}

export type RenderedEmail = {
  subject: string
  html: string
  text: string
  replyTo?: string
}

export async function renderEmail(
  template: string,
  data: Record<string, unknown>
): Promise<RenderedEmail | null> {
  const entry = registry[template]
  if (!entry) {
    return null
  }

  const element = createElement(entry.component, data)
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ])

  return {
    subject: entry.subject(data),
    html,
    text,
    replyTo: entry.replyTo?.(data),
  }
}
