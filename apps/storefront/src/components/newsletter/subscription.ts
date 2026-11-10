import { sdk } from "@/lib/medusa/sdk"

export const NEWSLETTER_SUBSCRIBED_KEY = "vetud_newsletter"

/** A preference marker only. Email addresses are never saved in browser storage. */
export function subscribedInBrowser() {
  try {
    return window.localStorage.getItem(NEWSLETTER_SUBSCRIBED_KEY) === "subscribed"
  } catch {
    return false
  }
}

export async function subscribeToNewsletter(input: { email: string; consent: true; countryCode: string; website?: string }) {
  const result = await sdk.client.fetch<{ success: boolean }>("/store/newsletter", {
    method: "POST",
    body: {
      email: input.email.trim(),
      consent: input.consent,
      country_code: input.countryCode,
      ...(input.website ? { website: input.website } : {}),
    },
  })
  if (result.success !== true) throw new Error("Newsletter signup was not confirmed")
  try {
    window.localStorage.setItem(NEWSLETTER_SUBSCRIBED_KEY, "subscribed")
  } catch {
    // A successful subscription must still work when browser storage is unavailable.
  }
}
