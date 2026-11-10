import type { EmailTemplate } from "./templates"

/** IDs of the published VETUD templates in Resend (Dashboard > Templates). */
export const RESEND_TEMPLATE_IDS: Partial<Record<EmailTemplate, string>> = {
  "contact-message": "b3793a79-5979-4695-ba0f-accf3a411617",
  "password-reset": "bdf14047-6454-45f8-89d6-70ca0a3c8286",
  "customer-welcome": "dd50a68b-070b-4cab-9398-f4d383ee63c3",
  "user-invite": "2f5adb06-9fe0-420e-b95c-f04837e2dba3",
  // Published separately for the education site; see .env.template.
  "email-list-confirm": process.env.RESEND_EMAIL_LIST_CONFIRM_TEMPLATE_ID,
}
