import type { EmailTemplate } from "./templates"

/**
 * IDs of the published templates in Resend. Written by emails/publish.mjs from emails/templates.json:
 * change the emails there, not here.
 */
export const RESEND_TEMPLATE_IDS: Partial<Record<EmailTemplate, string>> = {
  "order-confirmation": "08d4fe11-7544-4d5b-bc37-d25018eab6ce",
  "order-admin": "96882a52-dc77-4ea3-9ab2-fb0d3435d79e",
  "promo-code": "741e9210-bf59-45e9-96dd-d463c6c34fca",
  "subscribe-admin": "23cd25a2-62e3-47fc-a2bf-736cfa071be1",
}
