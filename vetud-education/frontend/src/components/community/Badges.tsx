import { useContentTranslator } from "@/i18n/use-content-translator"
import Box from "@mui/material/Box"
import type { ReactNode } from "react"
import Icon, { type IconName } from "../brand/Icon"
import { AppLink } from "../common/links"
import type { ForumAuthor } from "@/lib/community/types"
import { brand } from "@/theme/tokens"

const TONES = {
  expert: { color: brand.blue675, bg: brand.blue50 },
  accepted: { color: brand.green775, bg: brand.stone75 },
  moderator: { color: brand.indigo625, bg: brand.indigo50 },
  neutral: { color: brand.slate650, bg: brand.slate50_2 },
  pending: { color: brand.orange750, bg: brand.orange75 },
} as const

export type BadgeTone = keyof typeof TONES

/** A small labelled pill; the words carry the meaning, the color only repeats it. */
export function Pill({ tone = "neutral", icon, children, title }: { tone?: BadgeTone; icon?: IconName; children: ReactNode; title?: string }) {
  const ct = useContentTranslator()
  const { color, bg } = TONES[tone]
  return <Box component="span" title={ct(title)} sx={{ display: "inline-flex", alignItems: "center", gap: .5, px: 1, py: .25, borderRadius: 999, bgcolor: bg, color, fontSize: 12, fontWeight: 650, lineHeight: 1.5, whiteSpace: "nowrap", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis" }}>
    {icon ? <Icon name={icon} sx={{ fontSize: 14 }} /> : null}
    {children}
  </Box>
}

/** Name (linked to the member page), role badge with credentials, and level. */
export function AuthorLine({ author, size = "medium" }: { author: ForumAuthor; size?: "small" | "medium" }) {
  const ct = useContentTranslator()
  const name = <Box component="span" translate="no" sx={{ fontWeight: 700, color: "brand.navy", fontSize: size === "small" ? 14 : 15 }}>{author.display_name}</Box>
  return <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 1, rowGap: .5, minWidth: 0 }}>
    {author.handle ? <AppLink href={`/community/members/${author.handle}`} underline="hover" sx={{ color: "inherit" }}>{ct(name)}</AppLink> : name}
    {author.role === "expert" ? <Pill tone="expert" icon="shield" title={ct("Verified by the Vetud team")}>{ct("Expert")}{author.credentials ? <span translate="no"> · {author.credentials}</span> : null}</Pill> : null}
    {author.role === "moderator" ? <Pill tone="moderator">{ct("Moderator")}</Pill> : null}
    {author.role === "member" && author.level_id !== "member" && author.level_id !== "newcomer" ? <Pill>{ct(author.level)}</Pill> : null}
  </Box>
}
