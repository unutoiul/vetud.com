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
        heading: "2. Account, eligibility and intended use",
        paragraphs: [
          "An account is required to place an order. We do not accept guest orders. When you order you tell us your company or institution and your field of research, and you confirm that the products are for laboratory research purposes only. We keep these details with your order.",
          "Our products are supplied exclusively for in-vitro laboratory research by qualified individuals and institutions. By ordering you confirm that you are at least 21 years old, that you have the training and facilities to handle research materials safely, and that you will not use the products for human therapeutic purposes, or for human or veterinary consumption, dosing or injection.",
          "We may refuse or cancel an order where we reasonably believe these conditions are not met, or where a product may not lawfully be supplied to the delivery country. See our Research use policy for details.",
        ],
      },
      {
        heading: "3. Orders and contract",
        paragraphs: [
          "Placing an order is an offer to buy. A contract is formed when we confirm your payment and dispatch the goods. Until then we may decline an order, for example because of a pricing error, a stock issue, or a failed verification, and we will refund any payment received.",
        ],
      },
      {
        heading: "4. Prices and payment",
        paragraphs: [
          "Prices are shown in the currency of your selected region. Taxes and duties are shown at checkout where applicable; import duties for your country may be charged by the carrier.",
          "You can pay with the payment methods offered at checkout, which may include card, PayPal, cryptocurrency and bank transfer. For bank transfer orders, stock is reserved for 3 business days after the order is placed, and orders not paid within that time may be cancelled.",
        ],
      },
      {
        heading: "5. Payment authorization (web authorization)",
        paragraphs: [
          `By submitting an order and entering your payment details on this website, you authorize ${COMPANY} and its payment processors to charge the payment method you provide for the total amount shown at checkout, including the product price, shipping and any applicable taxes. This is an authorization given electronically over the internet, and it has the same effect as your written signature.`,
          "You confirm that you are the authorized holder of the payment method, or that you have the holder's permission to use it, and that the billing details you provide are accurate and complete. We may ask you to verify your identity or your payment method before we ship an order, and we may delay or cancel an order that fails verification.",
          `Card details are handled by our payment processor and are not stored on our servers. We will not charge your payment method for any amount beyond the total you approved at checkout without your separate authorization. If you have a problem with a charge, please contact us at ${EMAIL} before you contact your bank, so that we can resolve it quickly. See our Chargeback policy.`,
        ],
      },
      {
        heading: "6. Delivery",
        paragraphs: [
          "Delivery times are estimates. Risk passes to you on delivery. See our Shipping policy for details.",
        ],
      },
      {
        heading: "7. Returns, refunds and chargebacks",
        paragraphs: [
          "Our Returns policy, Refund policy and Chargeback policy form part of these terms.",
        ],
      },
      {
        heading: "8. Product information",
        paragraphs: [
          "Specifications describe the material supplied. We make no representation about suitability for any particular application, and nothing on this website is medical advice.",
        ],
      },
      {
        heading: "9. Liability",
        paragraphs: [
          "To the extent permitted by law, our liability for any order is limited to the price paid for it. Nothing in these terms limits liability that cannot be limited by law.",
        ],
      },
      {
        heading: "10. Governing law",
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
    slug: "shipping",
    title: "Shipping policy",
    summary: "Where we ship, how long it takes and what it costs.",
    updated: "27 October 2026",
    sections: [
      {
        heading: "Where we ship",
        paragraphs: [
          "We currently ship to the countries shown in the country selector. Some products may be unavailable in some countries, and we may decline to ship to a destination where the products cannot lawfully be supplied.",
        ],
      },
      {
        heading: "Order verification",
        paragraphs: [
          "Before we ship, we may ask you to verify your identity, your institution or your intended research use. Orders that cannot be verified may be delayed or cancelled and refunded.",
        ],
      },
      {
        heading: "Processing time",
        paragraphs: ["Orders ship within 1–2 business days after payment is confirmed."],
      },
      {
        heading: "Delivery options and tracking",
        paragraphs: [
          "Standard: 3–5 business days, tracked. Free above the threshold shown at checkout. Express: 1–2 business days, tracked. Rates for your region are shown at checkout.",
          "We email a tracking number when your order ships, and you can follow it from your account under Orders.",
        ],
      },
      {
        heading: "Customs and duties",
        paragraphs: ["International shipments may be subject to import duties and taxes, which are the recipient's responsibility. You are responsible for knowing the import rules for research materials in your country."],
      },
      {
        heading: "Address accuracy",
        paragraphs: [
          `Please check your delivery address and company or institution name before you order. We are not responsible for delays or losses caused by an incorrect address. If an order is lost or delayed, contact us at ${EMAIL} with your order number.`,
        ],
      },
      {
        heading: "Storage on arrival",
        paragraphs: [
          "Follow the storage conditions shown on the product label and documentation as soon as you receive your order.",
        ],
      },
    ],
  },
  {
    slug: "returns",
    title: "Returns policy",
    summary: "When and how you can return an order.",
    updated: "27 October 2026",
    sections: [
      {
        heading: "What can be returned",
        paragraphs: [
          "Sealed, unopened items in their original packaging with the tamper seal intact can be returned within 14 days of delivery.",
          "Opened or used items, and items that have been stored incorrectly, cannot be returned for safety and integrity reasons, except where they are faulty.",
        ],
      },
      {
        heading: "How to return",
        paragraphs: [
          `Contact us at ${EMAIL} first with your order number and the reason for the return. We will send return instructions. Returns sent without prior authorization may not be accepted.`,
          "Unless the item is faulty or we sent the wrong one, you pay the cost of returning it. Please use a tracked service and keep proof of postage.",
        ],
      },
      {
        heading: "Faulty, damaged or incorrect items",
        paragraphs: [
          "If something arrives damaged or incorrect, contact us within 7 days of delivery with your order number, the lot number and photos. We will replace it or refund it, and we pay for its return if we ask for it back.",
        ],
      },
      {
        heading: "After we receive your return",
        paragraphs: [
          "We inspect returned items on arrival. If the return is accepted, we refund you as described in our Refund policy.",
        ],
      },
    ],
  },
  {
    slug: "refunds",
    title: "Refund policy",
    summary: "When we refund an order and how long it takes.",
    updated: "27 October 2026",
    sections: [
      {
        heading: "When we refund",
        paragraphs: [
          "We refund orders that are cancelled before dispatch, returns we accept under our Returns policy, items that arrive damaged, faulty or incorrect, and orders that do not arrive and cannot be traced.",
        ],
      },
      {
        heading: "How refunds are paid",
        paragraphs: [
          "Refunds are paid to the original payment method. Bank transfer refunds go to the account the payment came from. Cryptocurrency payments are refunded manually, and we will contact you for a refund address.",
        ],
      },
      {
        heading: "How long it takes",
        paragraphs: [
          "We process an approved refund within 5 business days. Your bank or card issuer may take several more days to show it on your statement.",
        ],
      },
      {
        heading: "What is refunded",
        paragraphs: [
          "We refund the price of the item. Shipping is refunded only if the order was cancelled before dispatch or the problem was our error. Opened items that are not faulty are not eligible for a refund.",
        ],
      },
      {
        heading: "Questions",
        paragraphs: [`Contact us at ${EMAIL} with your order number if you have a question about a refund.`],
      },
    ],
  },
  {
    slug: "chargebacks",
    title: "Chargeback policy",
    summary: "What to do about a payment problem, and how we handle disputes.",
    updated: "27 October 2026",
    sections: [
      {
        heading: "Contact us first",
        paragraphs: [
          `If you do not recognise a charge, or something is wrong with your order, please contact us at ${EMAIL} before you open a dispute with your bank or card issuer. We reply within 2 business days and can usually resolve it faster than a dispute, including by refunding you under our Refund policy.`,
        ],
      },
      {
        heading: "Suspected fraud",
        paragraphs: [
          "If you believe a payment was made without your authorization, tell us and your card issuer immediately. We take fraud seriously and will cooperate fully with genuine fraud claims.",
        ],
      },
      {
        heading: "Records we keep",
        paragraphs: [
          "To handle disputes fairly, we keep a record of each order, including your account, the company and research details you provided, your acceptance of our Terms and the research-use confirmation, the time of the order, the payment details we are allowed to keep, shipping and tracking information, delivery confirmation and our correspondence with you. We may provide these records to our payment processor and your card issuer to respond to a dispute.",
        ],
      },
      {
        heading: "Disputes we believe are unjustified",
        paragraphs: [
          "If a dispute is opened for an order that was delivered as described, and you did not contact us first, we will contest it with the records above. We may suspend an account that opens repeated unjustified disputes and decline future orders from it, and where the law allows we may recover reasonable costs and fees we incur.",
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
