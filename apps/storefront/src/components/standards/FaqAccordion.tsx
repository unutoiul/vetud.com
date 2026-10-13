"use client"

import { ChevronDownIcon as ExpandMoreIcon } from "@/components/brand/Icon"
import Accordion from "@mui/material/Accordion"
import AccordionDetails from "@mui/material/AccordionDetails"
import AccordionSummary from "@mui/material/AccordionSummary"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { useId } from "react"

export type FaqItem = { question: string; answer: string }

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const id = useId()
  return (
    <Box sx={{ borderTop: "1px solid", borderColor: "brand.lineStrong" }}>
      {items.map((item, index) => (
        <Accordion key={item.question}>
          <AccordionSummary id={`${id}-${index}-header`} aria-controls={`${id}-${index}-content`} expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" component="h3">
              {item.question}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography sx={{ color: "text.secondary", maxWidth: 680 }}>{item.answer}</Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  )
}
