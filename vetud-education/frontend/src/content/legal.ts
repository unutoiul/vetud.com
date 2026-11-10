import { SHOP_URL, SITE } from "@/lib/config"

/** How legal pages name the separate shop. */
export const SHOP_NAME = SHOP_URL ? SHOP_URL.replace(/^https?:\/\//, "") : "[shop domain]"

/**
 * Legal page drafts for the education site. Replace every [bracketed placeholder] and have the text
 * reviewed by a lawyer for each country you publish in before launch.
 */

export type LegalSection = { heading: string; paragraphs: string[] }

export type LegalDocument = {
  slug: string
  title: string
  summary: string
  updated: string
  sections: LegalSection[]
}

const EMAIL = SITE.email
const OPERATOR = "[Company legal name]"
// Filled in after translation (see SHOP_NAME), so the text doesn't depend on the shop's address.
const SHOP = "{shop}"
const UPDATED = "10 November 2026"

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    slug: "privacy",
    title: "Privacy policy",
    summary: "What we collect on the education site, why, and the choices you have.",
    updated: UPDATED,
    sections: [
      { heading: "Who is responsible", paragraphs: [`${OPERATOR}, [registered address], runs this site and is responsible for your personal data. Contact us at ${EMAIL}.`] },
      { heading: "What we collect", paragraphs: [
        "Account details: your name, email address and a protected version of your password.",
        "What you publish: community posts, photos, votes, your display name and any biography. These are public.",
        "Email list: your address, your language, the wording you agreed to, and when you agreed and confirmed.",
        "Contact messages: your name, email address and whatever you write to us.",
        "Technical data needed to run the site, such as server logs.",
      ] },
      { heading: "Why we use it", paragraphs: [
        "To run your account and the community because you asked us to (contract), to keep the community safe and to moderate it (legitimate interests), and to send the email list only if you agreed and confirmed (consent).",
      ] },
      { heading: "Who handles it for us", paragraphs: ["We use Vercel to host the website, Railway to host our servers and database, and Resend to send email. They process data for us under their own security and data protection terms. Some may process it outside your country."] },
      { heading: "Browser storage", paragraphs: ["We keep your sign-in in your browser's local storage and your language choice in a cookie. We use no advertising or analytics cookies on this site."] },
      { heading: "The separate shop", paragraphs: [`The shop at ${SHOP} is a separate website with its own accounts, email list and privacy policy. Signing up here does not sign you up there.`] },
      { heading: "How long we keep it", paragraphs: ["[Retention periods to be confirmed.] You can unsubscribe from the email list at any time using the link in our emails."] },
      { heading: "Your rights", paragraphs: [`Depending on where you live, you can ask to see, correct, delete or move your data, object to how we use it, or withdraw consent. Write to ${EMAIL}. You can also complain to your data protection authority.`] },
    ],
  },
  {
    slug: "terms-of-use",
    title: "Terms of use",
    summary: "The rules for using this site and taking part in the community.",
    updated: UPDATED,
    sections: [
      { heading: "About this site", paragraphs: [`This site is run by ${OPERATOR}. It explains published peptide research for education. By using it you accept these terms.`] },
      { heading: "Not medical advice", paragraphs: ["Nothing here is medical advice, a diagnosis or a recommendation to use any substance. See our medical disclaimer."] },
      { heading: "Your account", paragraphs: ["Keep your password private. You are responsible for what is posted from your account. You must be at least 18 to create one."] },
      { heading: "What you post", paragraphs: [
        "You keep ownership of what you post. You give us a worldwide, royalty-free licence to host, display and moderate it on this site for as long as it stays here.",
        "Follow the community guidelines. Do not post doses, personal protocols, medical claims, or anything unlawful, abusive or misleading. We may hold, edit, hide or remove posts and suspend accounts.",
      ] },
      { heading: "Accuracy", paragraphs: ["We work to keep our guides accurate and sourced, but research changes and we cannot promise that everything is complete or current."] },
      { heading: "Our operator also sells products", paragraphs: [`${OPERATOR} also operates a separate shop at ${SHOP}. This site may link to it. Purchases are governed by that shop's own terms.`] },
      { heading: "Liability and law", paragraphs: ["[Liability wording and governing law to be confirmed by a lawyer.]"] },
    ],
  },
  {
    slug: "disclaimer",
    title: "Medical disclaimer",
    summary: "This site explains research. It does not give medical advice.",
    updated: UPDATED,
    sections: [
      { heading: "Education only", paragraphs: [SITE.siteNotice, "Talk to a doctor before starting, stopping or changing any treatment."] },
      { heading: "Research is not a recommendation", paragraphs: ["Describing a study does not mean a substance is safe, effective or legal where you live. Many peptides covered here are not approved for human use. Results in animals or small trials often do not hold up in people."] },
      { heading: "Community posts", paragraphs: ["Posts are the personal views of members. We do not verify them, and they are not medical advice, including answers from members marked as experts."] },
      { heading: "In an emergency", paragraphs: ["If you think you are having a medical emergency, contact your local emergency services immediately."] },
    ],
  },
  {
    slug: "legal-notice",
    title: "Legal notice",
    summary: "Who publishes this site.",
    updated: UPDATED,
    sections: [
      { heading: "Publisher", paragraphs: [`${OPERATOR}, [legal form], [registered address], [company registration number], [VAT number]. Director of publication: [name]. Email: ${EMAIL}.`] },
      { heading: "Hosting", paragraphs: ["Website: Vercel Inc., [address to be confirmed]. Servers: Railway Corporation, [address to be confirmed]."] },
      { heading: "Related business", paragraphs: [`The publisher also operates a shop at ${SHOP}.`] },
    ],
  },
]

export function getLegalDocument(slug: string) {
  return LEGAL_DOCUMENTS.find((document) => document.slug === slug)
}
