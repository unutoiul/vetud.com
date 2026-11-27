/** Primary destinations, in the same order in the header, drawer and footer. */
export const NAV_LINKS = [
  { href: "/learn", label: "learn", icon: "molecule" },
  { href: "/book", label: "book", icon: "document" },
  { href: "/news", label: "news", icon: "news" },
  { href: "/videos", label: "videos", icon: "play" },
  { href: "/community", label: "community", icon: "chat" },
] as const

export function currentNavLocation(segments: string[], href: string) {
  if (href === "/" && !segments.length) return "page"
  if (segments.length && href === `/${segments[0]}`) {
    return segments.length === 1 ? "page" : "location"
  }
}

export const FOOTER_LEGAL_LINKS = [
  { label: "Privacy policy", href: "/legal/privacy" },
  { label: "Terms of use", href: "/legal/terms-of-use" },
  { label: "Medical disclaimer", href: "/legal/disclaimer" },
  { label: "Legal notice", href: "/legal/legal-notice" },
  { label: "Community guidelines", href: "/community/guidelines" },
]
