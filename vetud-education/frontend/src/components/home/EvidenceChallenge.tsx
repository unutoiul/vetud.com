"use client"

import { useId, useState } from "react"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { brand } from "@/theme/tokens"
import Icon from "../brand/Icon"
import Section from "../common/Section"

const answers = [
  { label: "It will work in people, too.", explanation: "Cells in a dish cannot show how a whole person will respond. Human studies are needed to investigate benefits and risks." },
  { label: "It affected cells under those study conditions.", explanation: "That is the supported conclusion. A cell study can reveal an interesting effect, but it does not establish a treatment’s safety or benefit in people." },
  { label: "It is safe because it is a peptide.", explanation: "Being a peptide describes a molecule’s chemistry, not its safety. Safety and effectiveness need to be studied for the specific treatment and use." },
]

export default function EvidenceChallenge() {
  const ct = useContentTranslator()
  const [answer, setAnswer] = useState<number | null>(null)
  const id = useId()
  return <Section tone="wash" aria-labelledby={`${id}-heading`} sx={{ py: { xs: 6, md: 8 } }}>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, .85fr) minmax(0, 1fr)" }, gap: { xs: 3, md: 8 }, alignItems: "start" }}>
      <Box>
        <Typography component="h2" variant="h2" id={`${id}-heading`}>{ct("An exciting result. But what does it prove?")}</Typography>
        <Typography sx={{ mt: 2, color: brand.navySoft, fontSize: 16, maxWidth: 480 }}>{ct("Try reading a research headline like a scientist. The important question is often who—or what—was actually studied.")}</Typography>
        <Box sx={{ mt: 3, p: 2.5, borderLeft: `3px solid ${brand.blue}`, bgcolor: "background.paper" }}>
          <Typography sx={{ fontSize: 13, color: brand.blue, mb: .75 }}>{ct("Imagine this headline")}</Typography>
          <Typography component="p" sx={{ fontSize: 22, lineHeight: 1.4, letterSpacing: "-.025em" }}>{ct("A peptide shows a promising effect in a cell study.")}</Typography>
        </Box>
      </Box>
      <Box>
        <Box role="group" aria-labelledby={`${id}-question`} sx={{ display: "grid", gap: 1.25 }}>
          <Typography id={`${id}-question`} component="h3" sx={{ fontSize: 19, fontWeight: 600, mb: 1 }}>{ct("What can we conclude?")}</Typography>
          {answers.map((item, index) => <Button key={item.label} aria-pressed={answer === index} aria-controls={`${id}-answer`} onClick={() => setAnswer(index)} sx={{ minHeight: 58, px: 2.5, py: 1.75, textAlign: "left", justifyContent: "space-between", gap: 2, fontSize: 15, lineHeight: 1.5, border: "1px solid", borderColor: answer === index ? brand.blue : brand.lineStrong, bgcolor: answer === index ? brand.mint : "background.paper", color: brand.navy, borderRadius: "10px", "&:hover": { bgcolor: brand.mint, transform: "none" } }}>{ct(item.label)}<Icon name={answer === index ? (index === 1 ? "checkCircle" : "close") : "arrowRight"} sx={{ fontSize: 20, flexShrink: 0 }} /></Button>)}
        </Box>
        <Box id={`${id}-answer`} role="status" aria-live="polite" aria-atomic="true" sx={{ mt: 2, minHeight: 100 }}>
          {answer === null ? <Typography sx={{ fontSize: 13, color: brand.navySoft }}>{ct("Choose an answer to see the explanation.")}</Typography> : <Box sx={{ p: 2.5, borderRadius: "10px", bgcolor: "background.paper" }}>
            <Typography sx={{ fontWeight: 650, color: brand.navy, mb: .75 }}>{ct(answer === 1 ? "Exactly. Keep the conclusion close to the evidence." : "Not quite. Look at the study type.")}</Typography>
            <Typography sx={{ fontSize: 14, lineHeight: 1.75, color: brand.navySoft }}>{ct(answers[answer].explanation)}</Typography>
          </Box>}
        </Box>
        <Box component="a" href="https://www.fda.gov/patients/drug-development-process/step-2-preclinical-research" target="_blank" rel="noopener noreferrer" sx={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 12, color: brand.navySoft, textUnderlineOffset: 4 }}>{ct("How evidence develops: FDA’s guide to preclinical research")}</Box>
      </Box>
    </Box>
  </Section>
}
