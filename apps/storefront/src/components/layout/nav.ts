export const NAV_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "Tracking", href: "/tracking" },
  { label: "Discover", href: "/discover" },
  { label: "Education", href: "/education" },
]

export const FOOTER_LINKS = {
  explore: [
    ...NAV_LINKS,
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
