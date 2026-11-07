"use client"

import { useTranslations } from "next-intl"

import Box from "@mui/material/Box"
import Link from "@mui/material/Link"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
import { AppLink } from "@/components/common/links"
import { EMERGING_WEIGHT_RESEARCH } from "@/content/learn/emerging-weight-research"
import { WEIGHT_LOSS_TRIALS, type WeightLossTrial } from "@/content/learn/weight-loss-trials"

// Emphasis form: the medicine in the brand blue, placebo in a gray that passes 3:1 on white
// (validated with the dataviz palette script). Bars grow from one baseline, max 18px thick.
const MEDICINE = "#3268aa"
const PLACEBO = "#8794a8"
const SCALE_MAX = 30
const TICKS = [0, 10, 20, 30]

const pct = (value: number) => `${value.toFixed(1)}%`

function Bar({ trial, value, color, series }: { trial: WeightLossTrial; value: number; color: string; series: "Medicine" | "Placebo" }) {
  const description = `${series === "Medicine" ? `${trial.medicine} ${trial.dose}` : "Placebo"}: ${pct(value)} average weight lost (${trial.trial}, ${trial.weeks} weeks)`
  return (
    <Tooltip arrow placement="top" title={<Box sx={{ py: .25 }}><Box component="strong" sx={{ display: "block", fontSize: 14 }}>{pct(value)}</Box><Box component="span" sx={{ fontSize: 12, opacity: .85 }}>{series === "Medicine" ? `${trial.medicine}, ${trial.dose}` : `Placebo, ${trial.trial}`}</Box></Box>}>
      <Box tabIndex={0} aria-label={description} sx={{ position: "relative", height: 22, display: "flex", alignItems: "center", cursor: "default", borderRadius: "4px", "&:focus-visible": { outline: "2px solid", outlineColor: "brand.blue", outlineOffset: 2 }, "&:hover .bar-fill, &:focus-visible .bar-fill": { filter: "brightness(1.12)" } }}>
        <Box className="bar-fill" sx={{ height: 18, width: `${(value / SCALE_MAX) * 100}%`, bgcolor: color, borderRadius: "0 4px 4px 0", transition: "filter .15s ease" }} />
        <Typography component="span" sx={{ ml: 1, fontSize: 12.5, fontWeight: series === "Medicine" ? 700 : 500, color: series === "Medicine" ? "text.primary" : "text.secondary", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{pct(value)}</Typography>
      </Box>
    </Tooltip>
  )
}

export default function WeightLossChart({ highlight }: { highlight?: string }) {
  const act = useTranslations("Actions")
  const hasHumanHighlight = WEIGHT_LOSS_TRIALS.some((trial) => trial.peptide === highlight)
  return (
    <Box component="figure" sx={{ m: 0, minWidth: 0, maxWidth: "100%", bgcolor: "#fff", border: "1px solid", borderColor: "divider", borderRadius: "10px", p: { xs: 2.5, md: 4 } }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 2, mb: 3 }}>
        <Box>
          <Typography component="figcaption" sx={{ fontSize: { xs: 19, md: 22 }, fontWeight: 650, letterSpacing: "-.02em" }}>Average body weight lost in human trials</Typography>
          <Typography sx={{ fontSize: 13.5, color: "text.secondary", mt: .5 }}>Each medicine compared with a placebo in its own trial. Ordered by reported average; this is not a head-to-head ranking.</Typography>
        </Box>
        <Box component="ul" aria-label="Legend" sx={{ display: "flex", gap: 2.5, listStyle: "none", m: 0, p: 0 }}>
          {[["Medicine", MEDICINE], ["Placebo", PLACEBO]].map(([label, color]) => <Box component="li" key={label} sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: 13, color: "text.secondary" }}><Box component="span" sx={{ width: 14, height: 14, borderRadius: "3px", bgcolor: color }} />{label}</Box>)}
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(220px, 280px) 1fr" }, columnGap: 3 }}>
        {WEIGHT_LOSS_TRIALS.map((trial) => {
          const muted = hasHumanHighlight && trial.peptide !== highlight
          return (
            <Box key={`${trial.trial}-${trial.dose}`} sx={{ display: "contents" }}>
              <Box sx={{ pt: { xs: 2.5, md: 2 }, pb: { md: 2 }, borderTop: { md: "1px solid" }, borderColor: { md: "divider" }, opacity: muted ? .5 : 1 }}>
                <Typography sx={{ fontWeight: 650, fontSize: 15 }}><AppLink href={`/learn/${trial.peptide}`} underline="hover" sx={{ fontWeight: "inherit", color: "inherit" }}>{trial.medicine}</AppLink> <Box component="span" sx={{ fontWeight: 400, color: "text.secondary" }}>· {trial.status}</Box></Typography>
                <Typography sx={{ fontSize: 12.5, color: "text.secondary", lineHeight: 1.5 }}>{trial.dose}<br />{trial.trial} · {trial.weeks} weeks · {trial.people.toLocaleString("en-US")} people</Typography>
              </Box>
              <Box sx={{ position: "relative", py: { xs: 1, md: 2 }, borderTop: { md: "1px solid" }, borderColor: { md: "divider" }, opacity: muted ? .5 : 1, display: "grid", alignContent: "center" }}>
                <Box sx={{ borderLeft: "1px solid #cbd6e6", display: "grid", rowGap: "2px", mr: 6,
                  // Hairline gridlines at each tick, behind the bars (same box the bar widths measure against).
                  backgroundImage: `linear-gradient(90deg, ${TICKS.slice(1).map((tick) => `transparent calc(${(tick / SCALE_MAX) * 100}% - 1px), #e2e8f0 calc(${(tick / SCALE_MAX) * 100}% - 1px), #e2e8f0 ${(tick / SCALE_MAX) * 100}%, transparent ${(tick / SCALE_MAX) * 100}%`).join(", ")})` }}>
                  <Bar trial={trial} value={trial.medicineLoss} color={MEDICINE} series="Medicine" />
                  <Bar trial={trial} value={trial.placeboLoss} color={PLACEBO} series="Placebo" />
                </Box>
              </Box>
            </Box>
          )
        })}
        <Box sx={{ display: { xs: "none", md: "block" } }} />
        <Box aria-hidden sx={{ position: "relative", height: 34, borderTop: "1px solid #cbd6e6", mr: 6, mt: { xs: 1, md: 0 } }}>
          {TICKS.map((tick) => <Typography key={tick} component="span" sx={{ position: "absolute", top: 6, left: `${(tick / SCALE_MAX) * 100}%`, translate: tick === 0 ? "0" : "-50%", fontSize: 12, color: "#67758b", fontVariantNumeric: "tabular-nums" }}>{tick}%</Typography>)}
        </Box>
      </Box>
      <Typography sx={{ fontSize: 12.5, color: "text.secondary", textAlign: { md: "right" }, mr: { md: 6 } }}>Average body weight lost</Typography>

      <Typography sx={{ mt: 3, pt: 2.5, borderTop: "1px solid", borderColor: "divider", fontSize: 13.5, color: "text.secondary", lineHeight: 1.7 }}>
        Each human trial had different people, doses and lengths, so compare with care. The bars describe approved or experimental medicines studied under medical supervision with diet and exercise advice, not laboratory research products. They use full journal reports; conference findings and different endpoints appear separately below.
      </Typography>

      <Box component="details" sx={{ mt: 2, "& summary": { cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: "brand.blue", minHeight: 44, display: "flex", alignItems: "center" } }}>
        <summary>Show these numbers as a table</summary>
        <Box sx={{ overflowX: "auto", maxWidth: "100%", mt: 1 }}>
          <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, "& th, & td": { textAlign: "left", p: 1.25, borderBottom: "1px solid", borderColor: "divider", whiteSpace: "nowrap" }, "& td.num": { textAlign: "right", fontVariantNumeric: "tabular-nums" }, "& th.num": { textAlign: "right" } }}>
            <thead><tr><th>Medicine</th><th>Trial</th><th className="num">People</th><th className="num">Weeks</th><th className="num">Medicine</th><th className="num">Placebo</th><th>Source</th></tr></thead>
            <tbody>
              {WEIGHT_LOSS_TRIALS.map((trial) => <tr key={`${trial.trial}-${trial.dose}`}>
                <td>{trial.medicine}, {trial.dose}</td><td>{trial.trial}</td><td className="num">{trial.people.toLocaleString("en-US")}</td><td className="num">{trial.weeks}</td><td className="num">{pct(trial.medicineLoss)}</td><td className="num">{pct(trial.placeboLoss)}</td>
                <td><Link href={trial.source} target="_blank" rel="noopener noreferrer">PubMed</Link></td>
              </tr>)}
            </tbody>
          </Box>
        </Box>
      </Box>

      <Box component="section" aria-label="PTT-A and CBL-514 evidence comparison" sx={{ mt: 3, pt: 3, borderTop: "1px solid", borderColor: "divider" }}>
        <Typography component="h2" sx={{ fontSize: { xs: 19, md: 22 }, fontWeight: 650, letterSpacing: "-.02em" }}>PTT-A and CBL-514: evidence so far</Typography>
        <Typography sx={{ mt: 1, mb: 2.5, fontSize: 14, lineHeight: 1.7, color: "text.secondary", maxWidth: 880 }}>Neither has a comparable average human body-weight-loss result in the research below. Animal body weight and human fat volume measure different things, so they are shown separately from the bars.</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          {EMERGING_WEIGHT_RESEARCH.map((research) => <Box component="article" key={research.peptide} sx={{ p: { xs: 2, md: 2.5 }, minWidth: 0, border: "1px solid", borderColor: research.peptide === highlight ? "brand.blue" : "divider", borderRadius: "8px", bgcolor: "brand.paper" }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "brand.blue" }}>{research.evidence}</Typography>
            <Typography component="h3" sx={{ mt: .75, fontSize: 22, fontWeight: 650 }}><AppLink href={`/learn/${research.peptide}`} underline="hover" sx={{ fontWeight: "inherit", color: "inherit" }}>{research.name}</AppLink></Typography>
            <Box component="dl" sx={{ m: 0, mt: 2, fontSize: 14, lineHeight: 1.7, "& dt": { fontWeight: 650, mt: 1.5 }, "& dd": { m: 0, color: "text.secondary" } }}>
              <dt>Average human body-weight loss</dt><dd>{research.humanWeightLoss}</dd>
              <dt>What was measured</dt><dd>{research.measured}</dd>
              <dt>Reported finding</dt><dd>{research.finding}</dd>
            </Box>
            <Typography sx={{ mt: 2, fontSize: 13.5, color: "text.secondary", lineHeight: 1.7 }}>{research.limitation}</Typography>
            <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", columnGap: 2, rowGap: .5, "& a": { display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 13.5, fontWeight: 600 } }}>
              <AppLink href={`/learn/${research.peptide}`}>{act("readProfile")}</AppLink>
              <AppLink href={`/news/${research.article}`}>{act("readArticle")}</AppLink>
              <Link href={research.source.url} target="_blank" rel="noopener noreferrer">{research.sourceLabel} ↗</Link>
            </Box>
          </Box>)}
        </Box>
      </Box>
    </Box>
  )
}
