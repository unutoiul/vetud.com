import { EDUCATION_CUTOVER, EDUCATION_URL } from "@/lib/config"

/** Message keys (Common namespace) for every navigation link, shared by the header and footer. */
export const NAV_LABEL_KEYS = {
  "/learn": "learn",
  "/news": "news",
  "/videos": "videos",
  "/community": "community",
  "/shop": "shop",
  "/standards": "standards",
  "/documentation": "documentation",
  "/tracking": "tracking",
  "/contact": "contact",
} as const

export type NavHref = keyof typeof NAV_LABEL_KEYS

type NavLink = { label: string; href: NavHref }

/** The shop as its own site. Education is one link out to the other site, added by the header and footer. */
const SHOP_LINKS: NavLink[] = [
  { label: "Shop", href: "/shop" },
  { label: "Our standards", href: "/standards" },
  { label: "Lab documentation", href: "/documentation" },
  { label: "Tracking", href: "/tracking" },
  { label: "Contact", href: "/contact" },
]

/** Learning comes first; the shop is one section of the site. */
const COMBINED_LINKS: NavLink[] = [
  { label: "Education", href: "/learn" },
  { label: "News", href: "/news" },
  { label: "Videos", href: "/videos" },
  { label: "Community", href: "/community" },
  { label: "Shop", href: "/shop" },
]

export const NAV_LINKS = EDUCATION_CUTOVER ? SHOP_LINKS : COMBINED_LINKS

export const SECONDARY_LINKS: NavLink[] = EDUCATION_CUTOVER ? [] : [
  { label: "Our standards", href: "/standards" },
  { label: "Lab documentation", href: "/documentation" },
  { label: "Tracking", href: "/tracking" },
  { label: "Contact", href: "/contact" },
]

export const FOOTER_LINKS = {
  explore: EDUCATION_CUTOVER ? [
    ...SHOP_LINKS.slice(0, 4),
    { label: "Education", href: EDUCATION_URL },
  ] : [
    ...NAV_LINKS,
    { label: "Our standards", href: "/standards" },
    { label: "Lab documentation", href: "/documentation" },
    { label: "Order tracking", href: "/tracking" },
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
