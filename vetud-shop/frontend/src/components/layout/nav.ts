import { educationHref } from "@/lib/config"

/** Message keys (Common namespace) for the shop's own pages, shared by the header and footer. */
export const NAV_LABEL_KEYS = {
  "/shop": "shop",
  "/standards": "standards",
  "/documentation": "documentation",
  "/tracking": "tracking",
  "/contact": "contact",
} as const

export type NavHref = keyof typeof NAV_LABEL_KEYS

type NavLink = { label: string; href: NavHref }

/** Links out to the education site (www.vetud.com). `key` is the label's message key (Common namespace). */
export const EDUCATION_LINKS = [
  { key: "learn", label: "Education", href: educationHref("/learn") },
  { key: "news", label: "News", href: educationHref("/news") },
  { key: "videos", label: "Videos", href: educationHref("/videos") },
  { key: "community", label: "Community", href: educationHref("/community") },
] as const

/**
 * The desktop header after the "Products" menu: the product menu leads, then lot documentation, then
 * one link out to the education site. News, videos and the community are in the footer.
 */
export const HEADER_LINKS: NavLink[] = [
  { label: "Lab documentation", href: "/documentation" },
]

export const SECONDARY_LINKS: NavLink[] = [
  { label: "Our standards", href: "/standards" },
  { label: "Lab documentation", href: "/documentation" },
  { label: "Tracking", href: "/tracking" },
  { label: "Contact", href: "/contact" },
]

export const FOOTER_LINKS = {
  explore: [
    { label: "Shop", href: "/shop" },
    { label: "Our standards", href: "/standards" },
    { label: "Lab documentation", href: "/documentation" },
    { label: "Order tracking", href: "/tracking" },
    ...EDUCATION_LINKS.map(({ label, href }) => ({ label, href })),
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
