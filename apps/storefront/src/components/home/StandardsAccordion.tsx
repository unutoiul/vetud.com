"use client"

import { PlusIcon as AddIcon } from "@/components/brand/Icon"
import Accordion from "@mui/material/Accordion"
import AccordionDetails from "@mui/material/AccordionDetails"
import AccordionSummary from "@mui/material/AccordionSummary"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { useState } from "react"
import Icon, { type IconName } from "../brand/Icon"

export type StandardStep = {
  title: string
  summary: string
  detail: string
}

export const STANDARD_STEPS: StandardStep[] = [
  {
    title: "Traceable by lot",
    summary: "Lot identifiers and supporting documents presented alongside each listing.",
    detail:
      "Every vial carries a lot number that maps to its batch record: synthesis date, HPLC purity and identity confirmation. Look up any lot on the documentation page or request the full certificate of analysis.",
  },
  {
    title: "Transparent specifications",
    summary: "Technical details shown clearly, with no unsupported performance promises.",
    detail:
      "Each product page lists form, purity target, storage conditions and available amounts. We describe materials, not outcomes: there are no claims about effects in humans or animals.",
  },
  {
    title: "Handled with care",
    summary: "Sealed, desiccated packing and tracked, region-aware shipping.",
    detail:
      "Orders are packed with desiccant in protective kit boxes and shipped from our warehouse with tracking. Standard shipping is free above the threshold in your region.",
  },
  {
    title: "Thoughtful support",
    summary: "Direct access to a team that can answer product and documentation questions.",
    detail:
      "Questions about a lot, storage or an order reach a real person. Use the contact form and include your order or lot number for the fastest answer.",
  },
]

export default function StandardsAccordion({ steps = STANDARD_STEPS }: { steps?: StandardStep[] }) {
  const stepIcons: IconName[] = ["document", "flask", "package", "support"]
  const [expanded, setExpanded] = useState<number | false>(0)

  return (
    <Box sx={{ borderTop: "1px solid", borderColor: "brand.lineStrong" }}>
      {steps.map((step, index) => (
        <Accordion
          key={step.title}
          expanded={expanded === index}
          onChange={(_, isOpen) => setExpanded(isOpen ? index : false)}
        >
          <AccordionSummary
            expandIcon={<AddIcon sx={{ color: "#4d8e8a", transition: "transform .3s cubic-bezier(.22,.68,0,1.05)" }} />}
            sx={{ "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": { transform: "rotate(45deg)" } }}
          >
            <Icon name={stepIcons[index] ?? "shield"} sx={{ color: "brand.blue", fontSize: 28, flexShrink: 0 }} />
            <Box>
              <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>
                {step.title}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {step.summary}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pl: { xs: 0, sm: "48px" } }}>
            <Typography variant="body2" sx={{ color: "text.primary", maxWidth: 560 }}>
              {step.detail}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  )
}
