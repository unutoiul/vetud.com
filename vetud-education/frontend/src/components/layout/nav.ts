/** Message keys (Common namespace) for every navigation link, shared by the header and footer. */
export const NAV_LABEL_KEYS = {
  "/learn": "learn",
  "/news": "news",
  "/videos": "videos",
  "/community": "community",
  "/contact": "contact",
} as const

export type NavHref = keyof typeof NAV_LABEL_KEYS

export const NAV_LINKS: { href: NavHref }[] = [
  { href: "/learn" },
  { href: "/news" },
  { href: "/videos" },
  { href: "/community" },
]

export const FOOTER_LEGAL_LINKS = [
  { label: "Privacy policy", href: "/legal/privacy" },
  { label: "Terms of use", href: "/legal/terms-of-use" },
  { label: "Medical disclaimer", href: "/legal/disclaimer" },
  { label: "Legal notice", href: "/legal/legal-notice" },
  { label: "Community guidelines", href: "/community/guidelines" },
]
