import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { EVIDENCE_STEPS, type Evidence } from "@/content/learn/categories"

/**
 * "How strong is the evidence?": the five steps from cells to an approved medicine, with the
 * compound's step highlighted and the steps below it filled in. The words carry the meaning;
 * colour only repeats it.
 */
export default function EvidenceLadder({ evidence, name }: { evidence: Evidence; name: string }) {
  const reached = EVIDENCE_STEPS.findIndex((step) => step.id === evidence)
  const current = EVIDENCE_STEPS[reached]
  return (
    <Box component="figure" sx={{ m: 0, maxWidth: 800 }}>
      <Typography component="figcaption" sx={{ fontSize: 15, fontWeight: 650, mb: 1.5 }}>
        How strong is the evidence?
        <Box component="span" sx={{ display: "block", fontSize: 14, fontWeight: 400, color: "text.secondary", mt: .25 }}>
          {name} has reached <strong>{current.label.toLowerCase()}</strong>: {current.explain.toLowerCase()}.
        </Box>
      </Typography>
      <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(5, minmax(0, 1fr))" }, gap: { xs: .75, sm: .5 } }}>
        {EVIDENCE_STEPS.map((step, index) => {
          const done = index <= reached
          const here = index === reached
          return (
            <Box component="li" key={step.id} aria-current={here ? "step" : undefined} sx={{
              display: "flex", flexDirection: { xs: "row", sm: "column" }, alignItems: { xs: "center", sm: "flex-start" }, gap: { xs: 1.25, sm: .75 },
              p: 1.25, borderRadius: "6px", border: "1px solid", borderColor: here ? "brand.blue" : "divider",
              bgcolor: here ? "brand.mintLight" : done ? "brand.mintWash" : "#fff",
            }}>
              <Box aria-hidden sx={{ width: { xs: 10, sm: "100%" }, height: { xs: 10, sm: 6 }, flexShrink: 0, borderRadius: 999, bgcolor: done ? "brand.blue" : "divider" }} />
              <Typography sx={{ fontSize: 12.5, lineHeight: 1.35, fontWeight: here ? 700 : 500, color: done ? "text.primary" : "text.secondary" }}>
                <Box component="span" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{`Step ${index + 1} of ${EVIDENCE_STEPS.length}: `}</Box>
                {step.label}
              </Typography>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
