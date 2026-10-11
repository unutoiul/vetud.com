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

const COMPANY = "[Company legal name]"
const ADDRESS = "[Registered address]"
const EMAIL = "[support email]"

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    slug: "terms",
    title: "Terms of sale",
    summary: "The terms that apply when you order from Vetud Peptides.",
    updated: "[Date]",
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
          "Orders are paid by bank transfer. Stock is reserved for [3] business days after the order is placed. Orders not paid within that time may be cancelled.",
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
        paragraphs: ["These terms are governed by the laws of [jurisdiction]. The courts of [jurisdiction] have jurisdiction."],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy policy",
    summary: "What personal data we collect, why, and your rights.",
    updated: "[Date]",
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
          "We use providers that process data on our behalf: website hosting ([Vercel / your host]), commerce backend hosting ([Railway]), transactional email ([Resend]) and our bank. They may process data outside your country under appropriate safeguards.",
        ],
      },
      {
        heading: "Retention",
        paragraphs: ["Order records are kept for [X] years for accounting purposes. Contact messages are kept for [X] months."],
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
    updated: "[Date]",
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
    summary: "The conditions under which we supply research materials.",
    updated: "[Date]",
    sections: [
      {
        heading: "Laboratory research only",
        paragraphs: [
          "All Vetud products are supplied strictly for in-vitro laboratory research and development. They are not drugs, food, dietary supplements or cosmetics, and are not intended to diagnose, treat, cure or prevent any disease.",
        ],
      },
      {
        heading: "No human or veterinary use",
        paragraphs: [
          "Products must not be administered to humans or animals in any form. We do not provide dosing information, protocols for personal use or medical advice, and our team will not answer such questions.",
        ],
      },
      {
        heading: "Qualified purchasers",
        paragraphs: [
          "Purchasers must be at least 21 years old and handle materials in an appropriate laboratory setting in accordance with all applicable laws and safety practices.",
        ],
      },
      {
        heading: "Our right to refuse",
        paragraphs: [
          "We may decline or cancel orders that indicate an intended use outside these conditions, or that cannot lawfully be shipped to the destination.",
        ],
      },
    ],
  },
]

export function getLegalDocument(slug: string) {
  return LEGAL_DOCUMENTS.find((document) => document.slug === slug) ?? null
}
