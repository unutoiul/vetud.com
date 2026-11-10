import type { EmailTemplate } from "./templates"

/** IDs of the published VETUD templates in Resend (Dashboard > Templates). */
export const RESEND_TEMPLATE_IDS: Partial<Record<EmailTemplate, string>> = {
  "order-placed": "24982617-509f-438b-bd91-6a55b930efa2",
  "order-placed-admin": "4320c538-6356-4c63-8cb8-40d41cf3d1ff",
  "shipment-created": "2767d25d-7489-42be-80e3-d29b55d67c27",
  "contact-message": "b3793a79-5979-4695-ba0f-accf3a411617",
  "password-reset": "bdf14047-6454-45f8-89d6-70ca0a3c8286",
  "newsletter-offer": "8a5bac5e-47eb-4109-ac30-140ff13ca836",
  "newsletter-welcome": "1b6ff6c2-51b1-454c-8407-022265637c59",
  "customer-welcome": "dd50a68b-070b-4cab-9398-f4d383ee63c3",
  "user-invite": "2f5adb06-9fe0-420e-b95c-f04837e2dba3",
  "payment-received": "ec704fb1-ee51-40c9-8d80-2aa261df1648",
  "order-canceled": "56b5e403-acee-4b0c-b7e5-3d69b56f3769",
  "refund-issued": "1188633b-4c2a-4a03-94e0-241c4387280a",
  "order-delivered": "35f8ba56-903f-4b9e-b9d8-272accf2b11c",
  "return-received": "32c50679-52eb-40d2-a4ad-622631b454ff",
}
