import { SITE } from "@/lib/config"

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
const OPERATOR = "Vetud LTD"
const ADDRESS = "120 Kings Road, London SW6 3BX, United Kingdom"
const UPDATED = "27 November 2026"

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    slug: "privacy",
    title: "Privacy policy",
    summary: "What we collect on the education site, why, and the choices you have.",
    updated: UPDATED,
    sections: [
      {
        heading: "Who is responsible",
        paragraphs: [
          `${OPERATOR}, ${ADDRESS}, runs this site and is responsible for your personal data. Contact us at ${EMAIL}.`,
        ],
      },
      {
        heading: "What we collect",
        paragraphs: [
          "Account details: your name and email address. You sign in with a one-time code we email you, so we store no password.",
          "What you publish: community posts, photos, votes, your display name and any biography. These are public.",
          "Email list: your address, your language, the wording you agreed to, and when you agreed and confirmed.",
          "Contact messages: your name, email address and whatever you write to us.",
          "Book requests and purchases: your email address (to send you the link to the book's page and, after payment, the download link) and the payment record. Stripe takes your card details on its own payment page; we never see or store them.",
          "Technical data needed to run the site, such as server logs.",
        ],
      },
      {
        heading: "Why we use it",
        paragraphs: [
          "To run your account and the community because you asked us to (contract), to keep the community safe and to moderate it (legitimate interests), and to send the email list only if you agreed and confirmed (consent).",
        ],
      },
      {
        heading: "Who handles it for us",
        paragraphs: [
          "We use Vercel to host the website, Railway to host our servers and database, Resend to send email, Stripe to sell our book and take payment for it, and Microsoft Clarity to see how pages are used. They process data for us under their own security and data protection terms. Some may process it outside your country.",
        ],
      },
      {
        heading: "Browser storage",
        paragraphs: [
          "We keep your sign-in in your browser's local storage and your language choice in a cookie. When you confirm you are 18 or older, a cookie remembers that for a year so we don't ask again; it stores nothing else about you. We use no advertising cookies.",
          "We use Microsoft Clarity to see how people use the site (clicks, scrolling and recordings of visits) so we can improve it. Anything you type is hidden, and your account page is hidden in full. If your browser is set to a European time zone, Clarity uses no cookies; elsewhere it sets analytics cookies.",
        ],
      },
      {
        heading: "Videos and sharing",
        paragraphs: [
          "Videos on this site are hosted by YouTube. They load from youtube-nocookie.com only when you press play; YouTube (Google) then receives data under its own privacy policy.",
          "The share buttons are ordinary links. Nothing is sent to Facebook, X or WhatsApp unless you click one, and then that service's own privacy policy applies. We use no Facebook or Meta tracking.",
        ],
      },
      {
        heading: "How long we keep it",
        paragraphs: [
          "Your account and what you publish: until you delete your account or ask us to delete them.",
          "Email list: until you unsubscribe, using the link in any of our emails. We keep the record of your agreement for as long as we may need to show it.",
          "Contact messages: up to 24 months.",
          "Book purchases: as long as tax and accounting law requires (usually six years).",
          "Microsoft Clarity keeps visit recordings for 30 days and usage summaries for up to 13 months. Server logs are kept for the short periods our hosts set.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          `Depending on where you live, you can ask to see, correct, delete or move your data, object to how we use it, or withdraw consent. Write to ${EMAIL}. You can also complain to your data protection authority.`,
        ],
      },
    ],
  },
  {
    slug: "terms-of-use",
    title: "Terms of use",
    summary: "The rules for using this site and taking part in the community.",
    updated: UPDATED,
    sections: [
      {
        heading: "About this site",
        paragraphs: [
          `This site is run by ${OPERATOR}. It explains published peptide research for education. By using it you accept these terms.`,
        ],
      },
      {
        heading: "Not medical advice",
        paragraphs: [
          "Nothing here is medical advice, a diagnosis or a recommendation to use any substance. See our medical disclaimer.",
        ],
      },
      {
        heading: "Your account",
        paragraphs: [
          "Sign-in codes are sent to your email, so keep your email account secure. You are responsible for what is posted from your account. You must be at least 18 to create one.",
        ],
      },
      {
        heading: "What you post",
        paragraphs: [
          "You keep ownership of what you post. You give us a worldwide, royalty-free licence to host, display and moderate it on this site for as long as it stays here.",
          "Follow the community guidelines. Do not post doses, personal protocols, medical claims, or anything unlawful, abusive or misleading. We may hold, edit, hide or remove posts and suspend accounts.",
        ],
      },
      {
        heading: "Buying the book",
        paragraphs: [
          "Peptides: The Complete Guide is a PDF book for personal use, sold for US$4.99 including any tax. Stripe sells it to you as our reseller: it takes the payment, handles sales tax or VAT and sends your receipt, under its own terms shown at checkout. You ask for it with your email address, we email you a link to its page on this site, and you pay there. As soon as the payment goes through, we email you a link to download the book. That link keeps working, so you can download it again later.",
          "Because it is digital content supplied straight away, you agree when you pay that we send it at once, and the 14-day right to cancel ends once you download it. If the file is faulty, doesn't download or the email doesn't arrive, write to us and we will fix it or refund you.",
          "Please don't share or resell the PDF. Like the rest of the site, it is education, not medical advice.",
        ],
      },
      {
        heading: "Accuracy",
        paragraphs: [
          "We work to keep our guides accurate and sourced, but research changes and we cannot promise that everything is complete or current.",
        ],
      },
      {
        heading: "Liability and law",
        paragraphs: [
          "We provide this site for general education, without warranties. As far as the law allows, we are not liable for loss arising from using the site, relying on its content, or posts by community members.",
          "Nothing in these terms limits liability that the law does not allow us to limit, such as for death or personal injury caused by negligence, or for fraud.",
          "These terms are governed by the law of England and Wales, and its courts have jurisdiction. If you live elsewhere, you keep the protection of your local consumer law.",
        ],
      },
    ],
  },
  {
    slug: "disclaimer",
    title: "Medical disclaimer",
    summary: "This site explains research. It does not give medical advice.",
    updated: UPDATED,
    sections: [
      {
        heading: "Education only",
        paragraphs: [SITE.siteNotice, "Talk to a doctor before starting, stopping or changing any treatment."],
      },
      {
        heading: "Research is not a recommendation",
        paragraphs: [
          "Describing a study does not mean a substance is safe, effective or legal where you live. Many peptides covered here are not approved for human use. Results in animals or small trials often do not hold up in people.",
        ],
      },
      {
        heading: "Community posts",
        paragraphs: [
          "Posts are the personal views of members. We do not verify them, and they are not medical advice, including answers from members marked as experts.",
        ],
      },
      {
        heading: "In an emergency",
        paragraphs: [
          "If you think you are having a medical emergency, contact your local emergency services immediately.",
        ],
      },
    ],
  },
  {
    slug: "legal-notice",
    title: "Legal notice",
    summary: "Who publishes this site.",
    updated: UPDATED,
    sections: [
      { heading: "Publisher", paragraphs: [`${OPERATOR}, private limited company, ${ADDRESS}. Email: ${EMAIL}.`] },
      { heading: "Hosting", paragraphs: ["Website: Vercel Inc. Servers: Railway Corporation."] },
    ],
  },
]

export function getLegalDocument(slug: string) {
  return LEGAL_DOCUMENTS.find((document) => document.slug === slug)
}
