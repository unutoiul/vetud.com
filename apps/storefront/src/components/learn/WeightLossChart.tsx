"use client"

import Box from "@mui/material/Box"
import Link from "@mui/material/Link"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
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
  return (
    <Box component="figure" sx={{ m: 0, minWidth: 0, maxWidth: "100%", bgcolor: "#fff", border: "1px solid", borderColor: "divider", borderRadius: "10px", p: { xs: 2.5, md: 4 } }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 2, mb: 3 }}>
        <Box>
          <Typography component="figcaption" sx={{ fontSize: { xs: 19, md: 22 }, fontWeight: 650, letterSpacing: "-.02em" }}>Average body weight lost in the main trials</Typography>
          <Typography sx={{ fontSize: 13.5, color: "text.secondary", mt: .5 }}>Each medicine compared with a placebo (a dummy treatment) in the same trial. Ranked by result.</Typography>
        </Box>
        <Box component="ul" aria-label="Legend" sx={{ display: "flex", gap: 2.5, listStyle: "none", m: 0, p: 0 }}>
          {[["Medicine", MEDICINE], ["Placebo", PLACEBO]].map(([label, color]) => <Box component="li" key={label} sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: 13, color: "text.secondary" }}><Box component="span" sx={{ width: 14, height: 14, borderRadius: "3px", bgcolor: color }} />{label}</Box>)}
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(220px, 280px) 1fr" }, columnGap: 3 }}>
        {WEIGHT_LOSS_TRIALS.map((trial) => {
          const muted = Boolean(highlight) && trial.peptide !== highlight
          return (
            <Box key={`${trial.trial}-${trial.dose}`} sx={{ display: "contents" }}>
              <Box sx={{ pt: { xs: 2.5, md: 2 }, pb: { md: 2 }, borderTop: { md: "1px solid" }, borderColor: { md: "divider" }, opacity: muted ? .5 : 1 }}>
                <Typography sx={{ fontWeight: 650, fontSize: 15 }}>{trial.medicine} <Box component="span" sx={{ fontWeight: 400, color: "text.secondary" }}>· {trial.status}</Box></Typography>
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
        Each trial had different people, doses and lengths, so compare with care. These are average results for approved or experimental medicines, taken under medical supervision alongside diet and exercise advice. They do not describe research materials sold for laboratory use. Only results published in medical journals are shown.
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
    </Box>
  )
}
