/**
 * Country delivery pages (/gb/delivery, /fr/delivery, /de/delivery, /es/delivery; owner, 2026-11-25):
 * local content for search in each market. Each page exists in one language only, its country's,
 * so its text is written here in that language instead of going through ct() and the translation
 * files.
 *
 * Facts from the owner: orders ship from within the EU, 1–2 business days after payment (shipping
 * policy), and arrive in 3–5 business days, tracked. The free-delivery amount, the currency and the
 * payment methods are read live from the shop, so they're passed in, never written here.
 *
 * Keep it factual: no delivery promises beyond these, no health claims, and the research-use note.
 */

export type PaymentKind = "card" | "bank" | "crypto"

/** Live values the page passes in. `free` and `methods` are already formatted for the language. */
export type DeliveryValues = { free: string | null; methods: string; currency: string; email: string }

export type LocalDelivery = {
  /** The page's locale, for number, currency and list formatting. */
  locale: string
  linkLabel: string
  metaTitle: string
  metaDescription: (values: DeliveryValues) => string
  eyebrow: string
  title: string
  intro: string
  breadcrumbHome: string
  facts: {
    time: { label: string; value: string; note: string }
    cost: { label: string; value: (values: DeliveryValues) => string; note: string; atCheckout: string }
    payment: { label: string; note: (values: DeliveryValues) => string; atCheckout: string }
    customs: { label: string; value: string; note: string }
  }
  howToPay: string
  /** Each provider's name and what paying with it is like; `short` is used in running text. */
  methods: Record<string, { kind: PaymentKind; name: string; short: string; text: string }>
  currencies: Record<string, string>
  faqTitle: string
  faq: (values: DeliveryValues) => { q: string; a: string }[]
  ctaTitle: string
  ctaButton: string
  links: { shipping: string; returns: string; contact: string }
}

const DELIVERY: Record<string, LocalDelivery> = {
  gb: {
    locale: "en-GB",
    linkLabel: "Delivery to the UK",
    metaTitle: "Research peptide delivery to the UK: times, costs and customs | VETUD",
    metaDescription: ({ free }) => `Tracked delivery to the UK in 3–5 business days, prices in pounds${free ? `, free over ${free}` : ""}. How to pay, UK customs and import VAT, and answers to common questions.`,
    eyebrow: "Delivery and payment",
    title: "Delivery to the UK",
    intro: "Everything about ordering from the UK: how long delivery takes, what it costs, how to pay and what happens at customs.",
    breadcrumbHome: "Home",
    facts: {
      time: { label: "Delivery time", value: "3–5 business days", note: "Tracked. Orders ship 1–2 business days after payment is confirmed." },
      cost: { label: "Delivery cost", value: ({ free }) => `Free over ${free}`, note: "Below that, the delivery price is shown at checkout before you pay.", atCheckout: "Shown at checkout" },
      payment: { label: "Payment", note: ({ currency }) => `Prices are shown and charged in ${currency}.`, atCheckout: "Shown at checkout" },
      customs: { label: "Customs", value: "UK customs apply", note: "Your order ships from the EU, so it goes through UK customs. UK import VAT, and duty on some goods, may be due." },
    },
    howToPay: "How to pay",
    methods: {
      pp_paygate_card: { kind: "card", name: "Credit or debit card", short: "card", text: "Place your order, then pay on PayGate's secure payment page." },
      pp_nmi_primary: { kind: "card", name: "Credit or debit card", short: "card", text: "Enter your card details securely at checkout." },
      pp_system_default: { kind: "bank", name: "Bank transfer", short: "bank transfer", text: "Payment instructions and your reference are emailed right after you order. We reserve your items while we wait for your payment." },
      pp_makepay_makepay: { kind: "crypto", name: "Cryptocurrency", short: "cryptocurrency", text: "Pay on MakePay's secure page. Your order is confirmed as soon as the network confirms the payment." },
      pp_paygate_crypto: { kind: "crypto", name: "Cryptocurrency", short: "cryptocurrency", text: "Choose a supported cryptocurrency on PayGate's payment page." },
    },
    currencies: { gbp: "pounds sterling", eur: "euros", usd: "US dollars" },
    faqTitle: "Questions about delivery to the UK",
    faq: ({ free, methods, currency, email }) => [
      { q: "How long does delivery to the UK take?", a: "We ship within 1–2 business days after your payment is confirmed. Delivery then takes 3–5 business days, and every parcel is tracked." },
      { q: "How much does delivery cost?", a: free ? `Delivery is free on orders over ${free}. Below that, you see the exact delivery price at checkout before you pay.` : "You see the exact delivery price at checkout before you pay." },
      { q: "Will I pay customs or import VAT?", a: "Your order ships from the EU, so it goes through UK customs. UK import VAT, and duty on some goods, may be due, and the carrier may ask you to pay them, plus a handling fee, before delivery. Import charges are the recipient's responsibility." },
      { q: "How can I pay?", a: `You can pay by ${methods}. You choose at checkout.` },
      { q: "Which currency do you charge in?", a: `Prices are shown and charged in ${currency}.` },
      { q: "Can I track my order?", a: "Yes. We email you a tracking number when your order ships, and you can follow it in your account." },
      { q: "What if my parcel is late or lost?", a: `Email us at ${email} with your order number and we'll look into it with the carrier.` },
      { q: "Are there rules for research materials?", a: "Our products are supplied for laboratory research use only. You are responsible for knowing the rules for research materials in the UK before you order." },
    ],
    ctaTitle: "Ready to order?",
    ctaButton: "Browse the shop",
    links: { shipping: "Shipping policy", returns: "Returns policy", contact: "Contact us" },
  },

  fr: {
    locale: "fr",
    linkLabel: "Livraison en France",
    metaTitle: "Livraison de peptides de recherche en France : délais, frais et paiement | VETUD",
    metaDescription: ({ free }) => `Livraison suivie en France en 3 à 5 jours ouvrés, prix en euros${free ? `, offerte dès ${free}` : ""}. Moyens de paiement, douane et réponses aux questions fréquentes.`,
    eyebrow: "Livraison et paiement",
    title: "Livraison en France",
    intro: "Tout ce qu'il faut savoir pour commander depuis la France : délais de livraison, frais, moyens de paiement et douane.",
    breadcrumbHome: "Accueil",
    facts: {
      time: { label: "Délai de livraison", value: "3 à 5 jours ouvrés", note: "Envoi suivi. Les commandes partent 1 à 2 jours ouvrés après la confirmation du paiement." },
      cost: { label: "Frais de livraison", value: ({ free }) => `Offerte dès ${free}`, note: "En dessous, le prix exact de la livraison s'affiche lors de la commande, avant le paiement.", atCheckout: "Affichés lors de la commande" },
      payment: { label: "Paiement", note: ({ currency }) => `Prix affichés et facturés en ${currency}.`, atCheckout: "Affiché lors de la commande" },
      customs: { label: "Douane", value: "Pas de douane", note: "Votre commande est expédiée depuis l'UE : pas de dédouanement ni de droits d'importation pour une livraison en France métropolitaine." },
    },
    howToPay: "Comment payer",
    methods: {
      pp_paygate_card: { kind: "card", name: "Carte bancaire", short: "carte bancaire", text: "Passez votre commande, puis réglez sur la page de paiement sécurisée de PayGate." },
      pp_nmi_primary: { kind: "card", name: "Carte bancaire", short: "carte bancaire", text: "Saisissez vos coordonnées bancaires en toute sécurité lors de la commande." },
      pp_system_default: { kind: "bank", name: "Virement bancaire", short: "virement bancaire", text: "Les instructions de paiement et votre référence vous sont envoyées par e-mail juste après la commande. Nous réservons vos articles en attendant votre paiement." },
      pp_makepay_makepay: { kind: "crypto", name: "Cryptomonnaie", short: "cryptomonnaie", text: "Réglez sur la page sécurisée de MakePay. Votre commande est confirmée dès que le réseau confirme le paiement." },
      pp_paygate_crypto: { kind: "crypto", name: "Cryptomonnaie", short: "cryptomonnaie", text: "Choisissez une cryptomonnaie prise en charge sur la page de paiement de PayGate." },
    },
    currencies: { eur: "euros", gbp: "livres sterling", usd: "dollars américains" },
    faqTitle: "Questions fréquentes sur la livraison en France",
    faq: ({ free, methods, currency, email }) => [
      { q: "Quel est le délai de livraison en France ?", a: "Nous expédions votre commande 1 à 2 jours ouvrés après la confirmation de votre paiement. La livraison prend ensuite 3 à 5 jours ouvrés, et chaque colis est suivi." },
      { q: "Combien coûte la livraison ?", a: free ? `La livraison est offerte dès ${free} d'achat. En dessous, vous voyez le prix exact de la livraison lors de la commande, avant de payer.` : "Vous voyez le prix exact de la livraison lors de la commande, avant de payer." },
      { q: "Vais-je payer des frais de douane ?", a: "Non, pour la France métropolitaine : votre commande est expédiée depuis l'Union européenne, sans dédouanement ni droits d'importation. Les envois vers les départements et régions d'outre-mer peuvent être soumis à des formalités de douane et à l'octroi de mer, à la charge du destinataire." },
      { q: "Comment puis-je payer ?", a: `Vous pouvez payer par ${methods}. Vous choisissez lors de la commande.` },
      { q: "Dans quelle devise suis-je facturé ?", a: `Les prix sont affichés et facturés en ${currency}.` },
      { q: "Puis-je suivre ma commande ?", a: "Oui. Nous vous envoyons un numéro de suivi par e-mail dès l'expédition, et vous pouvez suivre votre colis depuis votre compte." },
      { q: "Que faire si mon colis est en retard ou perdu ?", a: `Écrivez-nous à ${email} en indiquant votre numéro de commande : nous nous en occupons avec le transporteur.` },
      { q: "Existe-t-il des règles pour les produits de recherche ?", a: "Nos produits sont fournis uniquement pour la recherche en laboratoire. Il vous appartient de connaître les règles applicables aux produits de recherche en France avant de commander." },
    ],
    ctaTitle: "Prêt à commander ?",
    ctaButton: "Voir la boutique",
    links: { shipping: "Politique de livraison", returns: "Politique de retour", contact: "Nous contacter" },
  },

  de: {
    locale: "de",
    linkLabel: "Lieferung nach Deutschland",
    metaTitle: "Lieferung von Forschungspeptiden nach Deutschland: Lieferzeit, Kosten und Zahlung | VETUD",
    metaDescription: ({ free }) => `Versand mit Sendungsverfolgung nach Deutschland in 3–5 Werktagen, Preise in Euro${free ? `, kostenlos ab ${free}` : ""}. Zahlungsarten, Zoll und Antworten auf häufige Fragen.`,
    eyebrow: "Versand und Zahlung",
    title: "Lieferung nach Deutschland",
    intro: "Alles zur Bestellung aus Deutschland: Lieferzeit, Versandkosten, Zahlungsarten und Zoll.",
    breadcrumbHome: "Startseite",
    facts: {
      time: { label: "Lieferzeit", value: "3–5 Werktage", note: "Mit Sendungsverfolgung. Bestellungen werden 1–2 Werktage nach Zahlungseingang versandt." },
      cost: { label: "Versandkosten", value: ({ free }) => `Kostenlos ab ${free}`, note: "Darunter sehen Sie den genauen Versandpreis an der Kasse, bevor Sie bezahlen.", atCheckout: "An der Kasse angezeigt" },
      payment: { label: "Zahlung", note: ({ currency }) => `Preise werden in ${currency} angezeigt und berechnet.`, atCheckout: "An der Kasse angezeigt" },
      customs: { label: "Zoll", value: "Kein Zoll", note: "Ihre Bestellung wird innerhalb der EU versendet: keine Zollabfertigung und keine Einfuhrabgaben bei Lieferung nach Deutschland." },
    },
    howToPay: "So bezahlen Sie",
    methods: {
      pp_paygate_card: { kind: "card", name: "Kredit- oder Debitkarte", short: "Karte", text: "Geben Sie Ihre Bestellung auf und bezahlen Sie anschließend auf der sicheren Zahlungsseite von PayGate." },
      pp_nmi_primary: { kind: "card", name: "Kredit- oder Debitkarte", short: "Karte", text: "Geben Sie Ihre Kartendaten sicher an der Kasse ein." },
      pp_system_default: { kind: "bank", name: "Banküberweisung", short: "Banküberweisung", text: "Zahlungsanweisungen und Ihre Referenz erhalten Sie direkt nach der Bestellung per E-Mail. Wir reservieren Ihre Artikel, bis Ihre Zahlung eingeht." },
      pp_makepay_makepay: { kind: "crypto", name: "Kryptowährung", short: "Kryptowährung", text: "Bezahlen Sie auf der sicheren Seite von MakePay. Ihre Bestellung ist bestätigt, sobald das Netzwerk die Zahlung bestätigt." },
      pp_paygate_crypto: { kind: "crypto", name: "Kryptowährung", short: "Kryptowährung", text: "Wählen Sie auf der Zahlungsseite von PayGate eine unterstützte Kryptowährung." },
    },
    currencies: { eur: "Euro", gbp: "Pfund Sterling", usd: "US-Dollar" },
    faqTitle: "Häufige Fragen zur Lieferung nach Deutschland",
    faq: ({ free, methods, currency, email }) => [
      { q: "Wie lange dauert die Lieferung nach Deutschland?", a: "Wir versenden Ihre Bestellung 1–2 Werktage nach Zahlungseingang. Die Zustellung dauert dann 3–5 Werktage, jedes Paket mit Sendungsverfolgung." },
      { q: "Was kostet der Versand?", a: free ? `Ab ${free} Bestellwert ist der Versand kostenlos. Darunter sehen Sie den genauen Versandpreis an der Kasse, bevor Sie bezahlen.` : "Den genauen Versandpreis sehen Sie an der Kasse, bevor Sie bezahlen." },
      { q: "Fallen Zoll oder Einfuhrabgaben an?", a: "Nein. Ihre Bestellung wird innerhalb der Europäischen Union versendet, daher gibt es bei Lieferung nach Deutschland weder Zollabfertigung noch Einfuhrabgaben." },
      { q: "Wie kann ich bezahlen?", a: `Sie können per ${methods} bezahlen. Die Zahlungsart wählen Sie an der Kasse.` },
      { q: "In welcher Währung wird abgerechnet?", a: `Preise werden in ${currency} angezeigt und berechnet.` },
      { q: "Kann ich meine Sendung verfolgen?", a: "Ja. Sobald Ihre Bestellung versandt ist, erhalten Sie per E-Mail eine Sendungsnummer, und Sie können die Sendung in Ihrem Konto verfolgen." },
      { q: "Was ist, wenn mein Paket verspätet ist oder verloren geht?", a: `Schreiben Sie uns an ${email} mit Ihrer Bestellnummer, und wir klären es mit dem Versanddienstleister.` },
      { q: "Gibt es Regeln für Forschungsmaterialien?", a: "Unsere Produkte werden ausschließlich für die Laborforschung geliefert. Sie sind dafür verantwortlich, die in Deutschland geltenden Regeln für Forschungsmaterialien vor der Bestellung zu kennen." },
    ],
    ctaTitle: "Bereit zu bestellen?",
    ctaButton: "Zum Shop",
    links: { shipping: "Versandrichtlinie", returns: "Rückgaberichtlinie", contact: "Kontakt" },
  },

  es: {
    locale: "es",
    linkLabel: "Envíos a España",
    metaTitle: "Envío de péptidos de investigación a España: plazos, costes y pago | VETUD",
    metaDescription: ({ free }) => `Envío con seguimiento a España en 3–5 días laborables, precios en euros${free ? `, gratis a partir de ${free}` : ""}. Formas de pago, aduanas y respuestas a preguntas frecuentes.`,
    eyebrow: "Envío y pago",
    title: "Envíos a España",
    intro: "Todo lo que necesitas saber para pedir desde España: plazos de entrega, costes de envío, formas de pago y aduanas.",
    breadcrumbHome: "Inicio",
    facts: {
      time: { label: "Plazo de entrega", value: "3–5 días laborables", note: "Con seguimiento. Enviamos los pedidos 1–2 días laborables después de confirmar el pago." },
      cost: { label: "Coste de envío", value: ({ free }) => `Gratis a partir de ${free}`, note: "Por debajo, ves el precio exacto del envío al finalizar la compra, antes de pagar.", atCheckout: "Se muestra al finalizar la compra" },
      payment: { label: "Pago", note: ({ currency }) => `Los precios se muestran y se cobran en ${currency}.`, atCheckout: "Se muestra al finalizar la compra" },
      customs: { label: "Aduanas", value: "Sin aduanas", note: "Tu pedido sale desde la UE: sin trámites de aduana ni aranceles de importación en envíos a la Península y Baleares." },
    },
    howToPay: "Cómo pagar",
    methods: {
      pp_paygate_card: { kind: "card", name: "Tarjeta de crédito o débito", short: "tarjeta", text: "Haz tu pedido y después paga en la página de pago segura de PayGate." },
      pp_nmi_primary: { kind: "card", name: "Tarjeta de crédito o débito", short: "tarjeta", text: "Introduce los datos de tu tarjeta de forma segura al finalizar la compra." },
      pp_system_default: { kind: "bank", name: "Transferencia bancaria", short: "transferencia bancaria", text: "Te enviamos por correo las instrucciones de pago y tu referencia justo después del pedido. Reservamos tus artículos mientras esperamos el pago." },
      pp_makepay_makepay: { kind: "crypto", name: "Criptomoneda", short: "criptomoneda", text: "Paga en la página segura de MakePay. Tu pedido se confirma en cuanto la red confirma el pago." },
      pp_paygate_crypto: { kind: "crypto", name: "Criptomoneda", short: "criptomoneda", text: "Elige una criptomoneda compatible en la página de pago de PayGate." },
    },
    currencies: { eur: "euros", gbp: "libras esterlinas", usd: "dólares estadounidenses" },
    faqTitle: "Preguntas frecuentes sobre envíos a España",
    faq: ({ free, methods, currency, email }) => [
      { q: "¿Cuánto tarda el envío a España?", a: "Enviamos tu pedido 1–2 días laborables después de confirmar el pago. La entrega tarda después 3–5 días laborables, y todos los paquetes llevan seguimiento." },
      { q: "¿Cuánto cuesta el envío?", a: free ? `El envío es gratis en pedidos a partir de ${free}. Por debajo, ves el precio exacto del envío al finalizar la compra, antes de pagar.` : "Ves el precio exacto del envío al finalizar la compra, antes de pagar." },
      { q: "¿Tendré que pagar aduanas o impuestos de importación?", a: "No en la Península ni en Baleares: tu pedido sale desde la Unión Europea, así que no hay trámites de aduana ni aranceles de importación. Los envíos a Canarias, Ceuta y Melilla pasan por aduana y pueden tener impuestos de importación, que corren a cargo del destinatario." },
      { q: "¿Cómo puedo pagar?", a: `Puedes pagar con ${methods}. Eliges la forma de pago al finalizar la compra.` },
      { q: "¿En qué moneda se cobra?", a: `Los precios se muestran y se cobran en ${currency}.` },
      { q: "¿Puedo seguir mi pedido?", a: "Sí. Te enviamos por correo un número de seguimiento cuando sale tu pedido, y puedes seguirlo desde tu cuenta." },
      { q: "¿Qué pasa si mi paquete se retrasa o se pierde?", a: `Escríbenos a ${email} con tu número de pedido y lo revisamos con la empresa de transporte.` },
      { q: "¿Hay normas para los materiales de investigación?", a: "Nuestros productos se suministran solo para investigación de laboratorio. Es tu responsabilidad conocer las normas sobre materiales de investigación en España antes de hacer el pedido." },
    ],
    ctaTitle: "¿Listo para pedir?",
    ctaButton: "Ver la tienda",
    links: { shipping: "Política de envíos", returns: "Política de devoluciones", contact: "Contacto" },
  },
}

/** The countries with a delivery page, in the order of the hreflang list. */
export const LOCAL_DELIVERY_COUNTRIES = Object.keys(DELIVERY)

export const getLocalDelivery = (country: string): LocalDelivery | null => DELIVERY[country.toLowerCase()] ?? null
