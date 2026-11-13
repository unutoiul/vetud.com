"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogContent from "@mui/material/DialogContent"
import FormControl from "@mui/material/FormControl"
import FormControlLabel from "@mui/material/FormControlLabel"
import FormHelperText from "@mui/material/FormHelperText"
import FormLabel from "@mui/material/FormLabel"
import Radio from "@mui/material/Radio"
import RadioGroup from "@mui/material/RadioGroup"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { alpha } from "@mui/material/styles"
import Image from "next/image"
import { useRef, useState, type FormEvent } from "react"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { brand } from "@/theme/tokens"
import Icon from "../brand/Icon"
import Logo from "../brand/Logo"
import HoldButton from "./HoldButton"
import { entryName } from "./entry-session"

export default function EntrySplash({ open, onEnter }: { open: boolean; onEnter: (name: string) => void }) {
  const ct = useContentTranslator()
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [ready, setReady] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const form = useRef<HTMLFormElement>(null)
  const greeting = useRef<HTMLHeadingElement>(null)
  const nameInvalid = !entryName(name)

  const continueToEntry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShowErrors(true)
    if (nameInvalid || age !== "adult") {
      form.current?.querySelector<HTMLInputElement>(nameInvalid ? 'input[name="visitor-name"]' : 'input[name="visitor-age"]')?.focus()
      return
    }
    setReady(true)
    // Move focus to the new heading so keyboard and screen-reader users hear the next step.
    window.requestAnimationFrame(() => greeting.current?.focus())
  }

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

        <Box sx={{ minWidth: 0, p: { xs: 3, sm: 4, md: 4.5 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 2.5 }}>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: .75, color: "brand.teal", fontSize: 12, fontWeight: 700 }}>
              <Icon name="shield" sx={{ fontSize: 17 }} />{ct("An 18+ learning space")}
            </Box>
            <Typography sx={{ color: "text.secondary", fontSize: 12, whiteSpace: "nowrap" }}>{ct(ready ? "Step 2 of 2" : "Step 1 of 2")}</Typography>
          </Box>
          <Typography ref={greeting} id="entry-title" component="h2" tabIndex={-1} sx={{ fontSize: { xs: 28, sm: 34 }, fontWeight: 600, lineHeight: 1.18, letterSpacing: "-.045em", textWrap: "balance", outline: "none" }}>
            {ready ? ct.template("Welcome, {v0}.", { v0: entryName(name) }, { translateValues: false }) : ct("Before we begin.")}
          </Typography>

          {ready ? <>
            <Typography id="entry-description" sx={{ mt: 1.5, color: "text.secondary", fontSize: 15, lineHeight: 1.75 }}>{ct("You're ready to explore. This site shares peptide research for education only.")}</Typography>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, p: 2.25, my: 3, bgcolor: "brand.mintWash", border: "1px solid", borderColor: "brand.line", borderRadius: "16px" }}>
              <Icon name="document" sx={{ mt: .25, color: "brand.teal", flexShrink: 0 }} />
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{ct("Curiosity starts here.")}</Typography>
                <Typography sx={{ mt: .75, color: "text.secondary", fontSize: 14, lineHeight: 1.7 }}>{ct("The information here is not medical advice. Speak with a qualified healthcare professional about your health.")}</Typography>
              </Box>
            </Box>
            <HoldButton fullWidth variant="contained" onConfirm={() => { if (entryName(name) && age === "adult") onEnter(entryName(name)) }} fill={alpha(brand.onNavy, .2)} startIcon={<Icon name="arrowRight" />} sx={{ minHeight: 54, borderRadius: "12px" }}>
              {ct("Enter website")}
            </HoldButton>
            <Typography sx={{ mt: 1.5, textAlign: "center", color: "text.secondary", fontSize: 12, lineHeight: 1.7 }}>{ct("Press and hold for 3 seconds to enter.")}</Typography>
            <Button onClick={() => { setReady(false); setShowErrors(false) }} fullWidth sx={{ mt: 1, minHeight: 44, fontSize: 13 }}>{ct("Edit my answers")}</Button>
          </> : <Box component="form" ref={form} onSubmit={continueToEntry} noValidate>
            <Typography id="entry-description" sx={{ mt: 1.5, mb: 3, color: "text.secondary", fontSize: 15, lineHeight: 1.75 }}>{ct("Tell us what to call you and confirm your age to enter.")}</Typography>
            <TextField autoFocus fullWidth required label={ct("Your first name")} name="visitor-name" value={name} onChange={event => setName(event.target.value)} error={showErrors && nameInvalid} helperText={showErrors && nameInvalid ? ct("Please enter your name.") : ct("A first name or nickname is fine.")} slotProps={{ htmlInput: { autoComplete: "given-name", maxLength: 80, spellCheck: false } }} />
            <FormControl component="fieldset" required error={showErrors && !age} fullWidth sx={{ mt: 2.5 }}>
              <FormLabel component="legend" id="entry-age-label" sx={{ fontSize: 14, fontWeight: 700, color: "text.primary" }}>{ct("Are you 18 or older?")}</FormLabel>
              <RadioGroup name="visitor-age" value={age} onChange={event => setAge(event.target.value)} aria-labelledby="entry-age-label" aria-describedby={showErrors && !age ? "entry-age-error" : age === "underage" ? "entry-age-restriction" : undefined} sx={{ mt: 1, gap: 1 }}>
                {[
                  { value: "adult", label: ct("Yes, I am 18 or older") },
                  { value: "underage", label: ct("No, I am under 18") },
                ].map(option => <FormControlLabel key={option.value} value={option.value} control={<Radio />} label={option.label} sx={{
                  m: 0, p: ".25rem .5rem", minHeight: 48, borderRadius: "12px", border: "1px solid", borderColor: age === option.value ? "brand.blue" : "brand.line",
                  bgcolor: age === option.value ? "brand.mintWash" : "transparent", "& .MuiFormControlLabel-label": { fontSize: 14 },
                }} />)}
              </RadioGroup>
              {showErrors && !age ? <FormHelperText id="entry-age-error">{ct("Please select an age option.")}</FormHelperText> : null}
            </FormControl>
            {age === "underage" ? <Alert id="entry-age-restriction" severity="info" sx={{ mt: 2, borderRadius: "12px" }}>{ct("This learning space is for adults aged 18 and over. You cannot enter yet.")}</Alert> : null}
            <Button type="submit" fullWidth variant="contained" disabled={age === "underage"} endIcon={<Icon name="arrowRight" />} sx={{ mt: 3, minHeight: 52, borderRadius: "12px" }}>{ct("Continue")}</Button>
            <Typography sx={{ mt: 2, color: "text.secondary", fontSize: 12, lineHeight: 1.7, textAlign: "center" }}>{ct("Your answers stay in this tab for this visit. This does not create an account or sign you up for emails.")}</Typography>
          </Box>}
        </Box>
      </Box>
    </DialogContent>
  </Dialog>
}
