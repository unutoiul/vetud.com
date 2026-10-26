export const NAV_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "Discover", href: "/discover" },
]

export const SECONDARY_LINKS = [
  { label: "Education", href: "/education" },
  { label: "Tracking", href: "/tracking" },
]

export const FOOTER_LINKS = {
  explore: [
    ...NAV_LINKS,
    ...SECONDARY_LINKS,
  ],
  information: [
    { label: "My orders & tracking", href: "/account/orders" },
    { label: "Shipping policy", href: "/legal/shipping" },
    { label: "Contact support", href: "/contact" },
  ],
  legal: [
    { label: "Terms of sale", href: "/legal/terms" },
    { label: "Privacy policy", href: "/legal/privacy" },
    { label: "Research use policy", href: "/legal/research-use" },
    { label: "Returns policy", href: "/legal/returns" },
    { label: "Refund policy", href: "/legal/refunds" },
    { label: "Chargeback policy", href: "/legal/chargebacks" },
  ],
}
