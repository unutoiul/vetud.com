import { useContentTranslator } from "@/i18n/use-content-translator"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import type { Source, StudyResult } from "@/content/learn/peptides"

const WHO = { people: "In people", animals: "In animals", cells: "In cells", review: "Review of studies" } as const
// The compound in the brand blue, comparisons in a grey that passes 3:1 on white (as in WeightLossChart).
const COMPOUND = "#3268aa"
const COMPARISON = "#8794a8"

const shown = (bar: { value: number; display?: string }, unit = "") => bar.display ?? `${bar.value.toLocaleString("en-US")}${unit}`

function Bars({ result }: { result: StudyResult }) {
  const ct = useContentTranslator()
  const bars = result.bars ?? []
  const max = Math.max(...bars.map((bar) => bar.value)) * 1.08
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "minmax(96px, max-content) 1fr", columnGap: 1.5, rowGap: .75, alignItems: "center" }}>
      {bars.map((bar, index) => (
        <Box key={bar.label} sx={{ display: "contents" }}>
          <Typography sx={{ fontSize: 13, fontWeight: index === 0 ? 650 : 500, color: index === 0 ? "text.primary" : "text.secondary" }}>{ct(bar.label)}</Typography>
          <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>
            <Box aria-hidden sx={{ height: 16, width: `${Math.max(2, (bar.value / max) * 100)}%`, bgcolor: index === 0 ? COMPOUND : COMPARISON, borderRadius: "0 4px 4px 0", flexShrink: 0, maxWidth: "calc(100% - 64px)" }} />
            <Typography component="span" sx={{ ml: 1, fontSize: 13, fontWeight: index === 0 ? 700 : 500, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{ct(shown(bar, result.unit))}</Typography>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

/**
 * Published results for a compound: bars when there's a comparison, a single number when there
 * isn't, and a sentence when there's nothing to chart. Each says who was studied and links its
 * source. `framing` sits on top (on product pages: these are not results of the research material).
 */
export default function StudyResults({ results, sources, framing }: { results: StudyResult[]; sources: Source[]; framing?: string }) {
  const ct = useContentTranslator()
  return (
    <Box sx={{ maxWidth: 800 }}>
      {framing ? <Typography sx={{ fontSize: 13.5, lineHeight: 1.7, color: "text.secondary", mb: 2 }}>{ct(framing)}</Typography> : null}
      <Box sx={{ display: "grid", gap: 2 }}>
        {results.map((result) => {
          const source = sources[result.source]
          const bars = result.bars ?? []
          const description = bars.length ? `${result.title}: ${bars.map((bar) => `${bar.label} ${shown(bar, result.unit)}`).join(", ")}${result.lowerIsBetter ? " (lower is better)" : ""}` : result.title
          return (
            <Box component="figure" key={result.title} aria-label={ct(description)} sx={{ m: 0, p: { xs: 2, md: 2.5 }, border: "1px solid", borderColor: "divider", borderRadius: "8px", bgcolor: "#fff" }}>
              <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mb: 1 }}>
                <Box component="span" sx={{ px: 1, py: .25, borderRadius: 999, fontSize: 11.5, fontWeight: 650, bgcolor: result.who === "people" ? "#e7effa" : result.who === "review" ? "#eef1f5" : "#fbf0dc", color: result.who === "people" ? "#1f4f86" : result.who === "review" ? "#4b5568" : "#7a4a00" }}>{ct(WHO[result.who])}</Box>
                {result.lowerIsBetter ? <Typography component="span" sx={{ fontSize: 12, color: "text.secondary" }}>{ct("Lower is better")}</Typography> : null}
              </Box>
              <Typography component="figcaption" sx={{ fontSize: 15.5, fontWeight: 650, lineHeight: 1.4 }}>{ct(result.title)}</Typography>
              <Typography sx={{ fontSize: 13, color: "text.secondary", lineHeight: 1.6, mt: .25, mb: bars.length || result.finding ? 1.5 : 0 }}>{ct(result.study)}</Typography>
              {bars.length > 1 ? <Bars result={result} /> : bars.length === 1 ? (
                <Typography sx={{ fontSize: { xs: 30, md: 34 }, fontWeight: 650, letterSpacing: "-.02em", color: COMPOUND, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>{ct(shown(bars[0], result.unit))}</Typography>
              ) : null}
              {result.finding ? <Typography sx={{ fontSize: 14, lineHeight: 1.7, mt: bars.length ? 1.25 : 0 }}>{ct(result.finding)}</Typography> : null}
              {source ? (
                <Typography sx={{ fontSize: 12, mt: 1.25, color: "text.secondary" }}>
                  {ct("Source:")} <Box component="a" href={source.url} target="_blank" rel="noopener noreferrer" sx={{ color: "brand.blue" }}>{ct(source.title)}</Box> · {ct(source.detail)}
                </Typography>
              ) : null}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
