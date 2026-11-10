import { useContentTranslator } from "@/i18n/use-content-translator"
import Box from "@mui/material/Box"
import { STATUSES, type StatusId } from "@/content/research/categories"

const TONES = {
  good: { color: "#235640", bg: "#e5f1ea", dot: "#2f7a55" },
  info: { color: "#1f4f86", bg: "#e7effa", dot: "#3268aa" },
  neutral: { color: "#4b5568", bg: "#eef1f5", dot: "#7a8597" },
  caution: { color: "#7a4a00", bg: "#fbf0dc", dot: "#c07d12" },
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
