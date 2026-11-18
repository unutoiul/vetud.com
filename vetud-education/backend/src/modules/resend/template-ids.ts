import type { EmailTemplate } from "./templates"

/**
 * IDs of the published VETUD education templates in Resend. Written by vetud-education/emails/publish.mjs from
 * templates.json: change the emails there, not here.
 */
export const RESEND_TEMPLATE_IDS: Partial<Record<EmailTemplate, string>> = {
  "email-list-signup-admin": "5c3d9995-6af7-4062-a759-9aa95925e834",
  "contact-message": "3ee86151-46d4-4dae-af51-d1fcad8c1539",
  "password-reset": "608766ea-43f2-4686-8ef4-4392d9aecdb9",
  "customer-welcome": "e5355481-26fd-4555-8274-d4bec4fa0bf9",
  "user-invite": "614b245d-ffb9-4cad-9fb4-6b1a25ed726b",
  "sign-in-code": "5c0f2bfd-5ade-406c-9b0f-029cfd491115",
  "email-list-confirm": "0c0cae3b-6391-48b0-a099-964cd04eb3f8",
  "email-list-confirm-fr": "5337b094-9a4e-4256-85fa-545775f0fcee",
}
