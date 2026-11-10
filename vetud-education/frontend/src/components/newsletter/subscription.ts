import { sdk } from "@/lib/medusa/sdk"

export const EMAIL_LIST_KEY = "vetud_email_list"

/** The exact wording the visitor ticks. The backend stores its own copy, so keep the two the same. */
export const EMAIL_LIST_CONSENT = "Yes, email me new VETUD guides and answered community questions. I can unsubscribe at any time."

/** A preference marker only. Email addresses are never saved in browser storage. */
export function subscribedInBrowser() {
  try {
    return window.localStorage.getItem(EMAIL_LIST_KEY) === "subscribed"
  } catch {
    return false
  }
}

/** Starts a sign-up. Nothing is sent to the address until the person confirms from our email. */
export async function subscribeToEmailList(input: { email: string; consent: true; language: string; website?: string }) {
  const result = await sdk.client.fetch<{ success: boolean }>("/store/email-list", {
    method: "POST",
    body: {
      email: input.email.trim(),
      consent: input.consent,
      locale: input.language,
      ...(input.website ? { website: input.website } : {}),
    },
  })
  if (result.success !== true) throw new Error("Sign-up was not confirmed")
  try {
    window.localStorage.setItem(EMAIL_LIST_KEY, "subscribed")
  } catch {
    // A successful sign-up must still work when browser storage is unavailable.
  }
}
