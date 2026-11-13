"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogContent from "@mui/material/DialogContent"
import Typography from "@mui/material/Typography"
import { alpha } from "@mui/material/styles"
import Image from "next/image"
import { useState } from "react"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { brand } from "@/theme/tokens"
import Icon from "../brand/Icon"
import Logo from "../brand/Logo"
import HoldButton from "./HoldButton"

export default function EntrySplash({ open, onEnter }: { open: boolean; onEnter: () => void }) {
  const ct = useContentTranslator()
  const [age, setAge] = useState<"adult" | "underage" | null>(null)

  return <Dialog
    open={open}
    fullWidth
    maxWidth="md"
    aria-labelledby="entry-title"
    aria-describedby="entry-description"
    // No close handler: Escape and backdrop clicks cannot dismiss this introduction.
    slotProps={{
      backdrop: { sx: { bgcolor: alpha(brand.navyDeep, .72), backdropFilter: "blur(7px)" } },
      paper: { sx: {
        m: { xs: 2, sm: 3 },
        width: { xs: "calc(100% - 32px)", sm: "calc(100% - 48px)" },
        maxHeight: "calc(100dvh - 32px)",
        borderRadius: { xs: "20px", sm: "28px" },
        bgcolor: "brand.paper",
        border: "1px solid",
        borderColor: alpha(brand.onNavy, .25),
        boxShadow: `0 32px 100px ${alpha(brand.navyDeep, .35)}`,
      } },
    }}
  >
    <DialogContent sx={{ p: 0 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, .85fr) minmax(0, 1.15fr)" } }}>
        <Box sx={{
          position: "relative", overflow: "hidden", display: "flex", flexDirection: "column",
          p: { xs: 3, sm: 4, md: 4.5 }, color: "brand.onNavy", bgcolor: "brand.navy",
          backgroundImage: `radial-gradient(ellipse at 0% 100%, ${alpha(brand.blue, .65)}, transparent 75%)`,
        }}>
          <Logo tone="light" />
          <Box sx={{ display: { xs: "none", md: "block" }, position: "relative", flex: 1, minHeight: 210, my: 3 }}>
            <Image src="/images/welcome-peptide-building-blocks-blue.webp" alt="" fill sizes="360px" style={{ objectFit: "contain" }} />
          </Box>
          <Box sx={{ mt: { xs: 2, md: 0 } }}>
            <Typography sx={{ color: "brand.cyan", fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>{ct("A clearer perspective")}</Typography>
            <Typography component="p" sx={{ mt: 1, fontSize: { xs: 23, md: 30 }, fontWeight: 600, lineHeight: 1.25, letterSpacing: "-.035em", textWrap: "balance" }}>{ct("Peptide science. Made simple.")}</Typography>
            <Typography sx={{ display: { xs: "none", md: "block" }, mt: 1.5, fontSize: 14, lineHeight: 1.7, color: "brand.onNavyMuted" }}>{ct("Explore the research, understand the evidence and learn at your own pace.")}</Typography>
          </Box>
        </Box>

        <Box sx={{ minWidth: 0, p: { xs: 3, sm: 4, md: 4.5 }, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: .75, color: "brand.teal", fontSize: 12, fontWeight: 700 }}>
              <Icon name="shield" sx={{ fontSize: 17 }} />{ct("An 18+ learning space")}
            </Box>
          </Box>
          <Typography id="entry-title" component="h2" sx={{ fontSize: { xs: 28, sm: 34 }, fontWeight: 600, lineHeight: 1.18, letterSpacing: "-.045em", textWrap: "balance" }}>
            {ct("Are you 18 or older?")}
          </Typography>
          <Typography id="entry-description" sx={{ mt: 1.5, mb: 3, color: "text.secondary", fontSize: 15, lineHeight: 1.75 }}>{ct("Please confirm your age to enter this educational website.")}</Typography>
          <Box role="group" aria-labelledby="entry-title">
            <Button type="button" fullWidth variant={age === "adult" ? "contained" : "outlined"} aria-pressed={age === "adult"} onClick={() => setAge("adult")} startIcon={age === "adult" ? <Icon name="check" /> : undefined} sx={{ minHeight: 52, borderRadius: "12px" }}>{ct("Yes, I am 18 or older")}</Button>
            <Button type="button" fullWidth variant={age === "underage" ? "contained" : "outlined"} aria-pressed={age === "underage"} onClick={() => setAge("underage")} sx={{ mt: 1.5, minHeight: 52, borderRadius: "12px" }}>{ct("No, I am under 18")}</Button>
          </Box>
          {age === "underage" ? <Alert severity="info" sx={{ mt: 2, borderRadius: "12px" }}>{ct("This learning space is for adults aged 18 and over. You cannot enter yet.")}</Alert> : null}
          <HoldButton fullWidth variant="contained" disabled={age !== "adult"} onConfirm={() => { if (age === "adult") onEnter() }} fill={alpha(brand.onNavy, .2)} startIcon={<Icon name="arrowRight" />} sx={{ mt: 3, minHeight: 54, borderRadius: "12px" }}>
            {ct("Enter website")}
          </HoldButton>
          <Typography sx={{ mt: 1.5, color: "text.secondary", fontSize: 12, lineHeight: 1.7, textAlign: "center" }}>{ct("Press and hold for 3 seconds to enter.")}</Typography>
          <Typography sx={{ mt: 2.5, color: "text.secondary", fontSize: 12, lineHeight: 1.7, textAlign: "center" }}>{ct("For research and education only. Not medical advice.")}</Typography>
        </Box>
      </Box>
    </DialogContent>
  </Dialog>
}
