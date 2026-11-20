import { useContentTranslator } from "@/i18n/use-content-translator"
import Box from "@mui/material/Box"
import { STATUSES, type StatusId } from "@/content/learn/categories"
import { brand } from "@/theme/tokens"

const TONES = {
  good: { color: brand.green775, bg: brand.stone75, dot: brand.green675 },
  info: { color: brand.blue675, bg: brand.blue50, dot: brand.blue },
  neutral: { color: brand.slate650, bg: brand.slate50_2, dot: brand.slate475 },
  caution: { color: brand.orange750, bg: brand.orange75, dot: brand.orange600 },
} as const

/** Approval status as a labelled pill; the dot repeats the tone, the words carry the meaning. */
export default function StatusBadge({ status, size = "medium" }: { status: StatusId; size?: "small" | "medium" }) {
  const ct = useContentTranslator()
  const meta = STATUSES[status]
  const tone = TONES[meta.tone]
  return (
    <Box component="span" title={ct(meta.explain)} sx={{ display: "inline-flex", alignItems: "center", gap: .75, px: size === "small" ? 1 : 1.25, py: size === "small" ? .25 : .5, borderRadius: 999, bgcolor: tone.bg, color: tone.color, fontSize: size === "small" ? 11.5 : 12.5, fontWeight: 650, lineHeight: 1.5, whiteSpace: "nowrap" }}>
      <Box component="span" aria-hidden sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: tone.dot }} />
      {ct(meta.label)}
    </Box>
  )
}
