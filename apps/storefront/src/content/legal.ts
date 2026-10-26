/**
 * Legal page templates. Replace every [bracketed placeholder] and have the text reviewed by a
 * lawyer for each market you sell to before launch. Research-material rules differ by country.
 */

export type LegalSection = { heading: string; paragraphs: string[] }

export type LegalDocument = {
  slug: string
  title: string
  summary: string
  updated: string
  sections: LegalSection[]
}

const COMPANY = "Vetud LTD"
const ADDRESS = "390 Fulham Road, London"
const EMAIL = "contact@vetud.com"

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    slug: "terms",
    title: "Terms of sale",
    summary: "The terms that apply when you order from Vetud Peptides.",
    updated: "1 January 2026",
    sections: [
      {
        heading: "1. Who we are",
        paragraphs: [
          `This website is operated by ${COMPANY}, ${ADDRESS} ("Vetud", "we", "us"). You can contact us at ${EMAIL}.`,
        ],
      },
      {
        heading: "2. Eligibility and intended use",
        paragraphs: [
          "Our products are supplied exclusively for in-vitro laboratory research by qualified individuals and institutions. By ordering you confirm that you are at least 21 years old, that you have the training and facilities to handle research materials safely, and that you will not use the products for human or veterinary consumption, diagnosis or treatment.",
          "We may refuse or cancel an order where we reasonably believe these conditions are not met, or where a product may not lawfully be supplied to the delivery country.",
        ],
      },
      {
        heading: "3. Orders and contract",
        paragraphs: [
          "Placing an order is an offer to buy. A contract is formed when we confirm your payment and dispatch the goods. Until then we may decline an order, for example because of a pricing error or stock issue, and we will refund any payment received.",
        ],
      },
      {
        heading: "4. Prices and payment",
        paragraphs: [
          "Prices are shown in the currency of your selected region. Taxes and duties are shown at checkout where applicable; import duties for your country may be charged by the carrier.",
          "Orders are paid by bank transfer. Stock is reserved for 3 business days after the order is placed. Orders not paid within that time may be cancelled.",
        ],
      },
      {
        heading: "5. Delivery",
        paragraphs: [
          "Delivery times are estimates. Risk passes to you on delivery. See our shipping and returns policy for details.",
        ],
      },
      {
        heading: "6. Product information",
        paragraphs: [
          "Specifications describe the material supplied. We make no representation about suitability for any particular application, and nothing on this website is medical advice.",
        ],
      },
      {
        heading: "7. Liability",
        paragraphs: [
          "To the extent permitted by law, our liability for any order is limited to the price paid for it. Nothing in these terms limits liability that cannot be limited by law.",
        ],
      },
      {
        heading: "8. Governing law",
        paragraphs: ["These terms are governed by the laws of England and Wales. The courts of England and Wales have jurisdiction."],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy policy",
    summary: "What personal data we collect, why, and your rights.",
    updated: "1 January 2026",
    sections: [
      {
        heading: "Controller",
        paragraphs: [`${COMPANY}, ${ADDRESS}, is responsible for your personal data. Contact: ${EMAIL}.`],
      },
      {
        heading: "Data we collect",
        paragraphs: [
          "Order data: name, email, shipping and billing address, phone number (optional) and order contents. Contact data: what you send through the contact form. Technical data: a cart identifier stored in your browser, and server logs.",
        ],
      },
      {
        heading: "Why we use it",
        paragraphs: [
          "To process and deliver orders and send related emails (contract), to answer your messages (legitimate interest), and to meet accounting and legal obligations (legal obligation).",
        ],
      },
      {
        heading: "Service providers",
        paragraphs: [
          "We use providers that process data on our behalf: website hosting (Vercel), commerce backend hosting (Railway), transactional email (Resend) and our bank. They may process data outside your country under appropriate safeguards.",
        ],
      },
      {
        heading: "Retention",
        paragraphs: ["Order records are kept for 6 years for accounting and tax purposes. Contact messages are kept for 30 days."],
      },
      {
        heading: "Your rights",
        paragraphs: [
          "Depending on where you live you may have the right to access, correct, delete or export your data, to object to processing and to complain to a data protection authority. Email us to exercise these rights.",
        ],
      },
      {
        heading: "Cookies and storage",
        paragraphs: [
          "We store a cart identifier in your browser's local storage so your cart persists between visits. We do not use advertising cookies.",
        ],
      },
    ],
  },
  {
    slug: "shipping-returns",
    title: "Shipping & returns",
    summary: "Delivery options, times, costs and how returns work.",
    updated: "1 January 2026",
    sections: [
      {
        heading: "Where we ship",
        paragraphs: [
          "We currently ship to the United States and selected European countries, shown in the country selector. Some products may be unavailable in some countries.",
        ],
      },
      {
        heading: "Processing time",
        paragraphs: ["Orders ship within 1–2 business days after payment is received."],
      },
      {
        heading: "Delivery options",
        paragraphs: [
          "Standard: 3–5 business days, tracked. Free above the threshold shown at checkout. Express: 1–2 business days, tracked. Rates for your region are shown at checkout.",
        ],
      },
      {
        heading: "Customs and duties",
        paragraphs: ["International shipments may be subject to import duties and taxes, which are the recipient's responsibility."],
      },
      {
        heading: "Returns",
        paragraphs: [
          "Sealed, unopened items in their original packaging can be returned within 14 days of delivery. Contact us first with your order number; we will send return instructions. Opened items cannot be returned for safety and integrity reasons, except where they are faulty.",
        ],
      },
      {
        heading: "Damaged or incorrect items",
        paragraphs: [
          "If something arrives damaged or incorrect, contact us within 7 days with your order number, lot number and photos. We will replace or refund it.",
        ],
      },
    ],
  },
  {
    slug: "research-use",
    title: "Research use policy",
    summary: "Research Use Only (RUO) notice: the conditions under which we supply research materials.",
    updated: "26 October 2026",
    sections: [
      {
        heading: "Research Use Only",
        paragraphs: [
          "All products sold by Vetud Peptides are supplied strictly for laboratory research and in-vitro analytical use by qualified professionals.",
          "They are not drugs, medicines, dietary supplements, foods, cosmetics or medical devices, and they have not been evaluated or approved by the FDA, the EMA or any other regulatory authority for any diagnostic, preventive or therapeutic purpose.",
        ],
      },
      {
        heading: "Not for human or veterinary use",
        paragraphs: [
          "Products are not for human or veterinary consumption, injection, ingestion, inhalation or topical application, and must not be used in humans or animals or for any clinical purpose.",
          "We do not provide dosing, administration or protocols for personal use, and we do not give medical advice. Our team will not answer such questions.",
        ],
      },
      {
        heading: "Qualified purchasers",
        paragraphs: [
          "By purchasing, you confirm that you are at least 21 years old and a qualified researcher or institution, or acting on behalf of one, with the training and facilities to handle research materials safely.",
          "You confirm that you will use the materials only for lawful laboratory research under appropriate safeguards, and that you will not resell or pass them on for human or animal use.",
        ],
      },
      {
        heading: "Your responsibility for compliance",
        paragraphs: [
          "You are responsible for complying with all laws and import regulations that apply to you and to the destination country, including any permits, licences or customs requirements for research materials.",
        ],
      },
      {
        heading: "Product documentation",
        paragraphs: [
          "Each product is identified by its lot number and a certificate of analysis for that lot. Information on this site is provided for research reference only and is not medical advice.",
        ],
      },
      {
        heading: "Our right to refuse",
        paragraphs: [
          "We may decline or cancel any order, request verification of the intended use, and report suspected misuse, where an order indicates a use outside this policy or cannot lawfully be shipped to the destination.",
          "All sales are subject to our Terms of sale.",
        ],
      },
    ],
  },
]

export function getLegalDocument(slug: string) {
  return LEGAL_DOCUMENTS.find((document) => document.slug === slug) ?? null
}
