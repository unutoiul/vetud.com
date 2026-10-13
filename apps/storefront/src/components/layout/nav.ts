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
    { label: "Shipping & returns", href: "/legal/shipping-returns" },
    { label: "Contact support", href: "/contact" },
  ],
  legal: [
    { label: "Terms of sale", href: "/legal/terms" },
    { label: "Privacy policy", href: "/legal/privacy" },
    { label: "Research use policy", href: "/legal/research-use" },
  ],
}
