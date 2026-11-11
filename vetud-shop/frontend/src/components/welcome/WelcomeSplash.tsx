"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Checkbox from "@mui/material/Checkbox"
import CircularProgress from "@mui/material/CircularProgress"
import Dialog from "@mui/material/Dialog"
import FormControlLabel from "@mui/material/FormControlLabel"
import FormHelperText from "@mui/material/FormHelperText"
import { alpha, keyframes, type SxProps, type Theme } from "@mui/material/styles"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useRef, useState, type FormEvent } from "react"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { brand } from "@/theme/tokens"
import Icon from "../brand/Icon"
import Logo from "../brand/Logo"
import { AppLink, useLocalizedHref } from "../common/links"
import { subscribeToNewsletter } from "../newsletter/subscription"
import { useStore } from "../store/StoreProvider"
import HoldButton from "./HoldButton"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const arrival = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`

const screenSx: SxProps<Theme> = {
  m: 0,
  borderRadius: 0,
  color: "brand.onNavy",
  bgcolor: "brand.navyDeep",
  backgroundImage: `radial-gradient(ellipse at 22% 46%, ${alpha(brand.blue, .42)}, transparent 65%)`,
  overflowX: "hidden",
  // The theme's blue focus ring is too faint on this navy screen.
  "& a:focus-visible, & button:focus-visible, & .MuiCheckbox-root.Mui-focusVisible": { outline: `2px solid ${brand.cyan}`, outlineOffset: 4 },
}

const descriptionSx: SxProps<Theme> = { maxWidth: 450, color: "brand.onNavyMuted", fontSize: { xs: 15, sm: 16 }, lineHeight: 1.75 }

const primaryButtonSx = {
  bgcolor: "brand.mintLight",
  color: "brand.navy",
  "&:hover": { bgcolor: "brand.onNavy" },
  "&.Mui-disabled": { bgcolor: "brand.navySoft", color: "brand.onNavyMuted" },
}

const emailInputSx: SxProps<Theme> = {
  bgcolor: alpha(brand.onNavy, .05),
  "& input": { minHeight: 24, fontSize: 16, color: "brand.onNavy" },
  "& input:-webkit-autofill": { WebkitTextFillColor: brand.onNavy, boxShadow: `0 0 0 40px ${brand.navy} inset`, caretColor: brand.onNavy },
  "& .MuiOutlinedInput-notchedOutline, &.Mui-error .MuiOutlinedInput-notchedOutline, &.Mui-disabled .MuiOutlinedInput-notchedOutline": { borderColor: alpha(brand.cyan, .5) },
  "&:hover .MuiOutlinedInput-notchedOutline, &.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "brand.cyan" },
}

const emailLabelSx: SxProps<Theme> = {
  color: "brand.onNavyMuted",
  "&.Mui-error, &.Mui-disabled": { color: "brand.onNavyMuted" },
  "&.Mui-focused": { color: "brand.cyan" },
}

const legalLinkSx: SxProps<Theme> = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 44,
  color: "brand.cyan",
  fontSize: 12,
  lineHeight: 1.5,
  textUnderlineOffset: "4px",
  "&:hover": { color: "brand.onNavy" },
}

export default function WelcomeSplash({ open, onDismiss, onSubscribed }: {
  open: boolean
  onDismiss: () => void
  onSubscribed: () => void
}) {
  const ct = useContentTranslator()
  const offerText = useTranslations("Offer")
  const actions = useTranslations("Actions")
  const footerText = useTranslations("Footer")
  const { countryCode } = useStore()
  const [email, setEmail] = useState("")
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState("")
  const [showErrors, setShowErrors] = useState(false)
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const submitting = useRef(false)
  const form = useRef<HTMLFormElement>(null)
  const joinButton = useRef<HTMLButtonElement>(null)
  const router = useRouter()
  const localize = useLocalizedHref()
  const emailInvalid = !EMAIL_PATTERN.test(email.trim()) || email.trim().length > 254

  // Every action on this screen is a three-second hold, so pressing Enter in the form only moves
  // to the Join button, where holding Enter (or the button) sends it.
  const holdToJoin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    joinButton.current?.focus()
  }

  const submit = async () => {
    if (submitting.current) return
    setShowErrors(true)
    if (emailInvalid || !consent) {
      form.current?.querySelector<HTMLInputElement>(emailInvalid ? 'input[type="email"]' : 'input[type="checkbox"]')?.focus()
      return
    }
    submitting.current = true
    setStatus("sending")
    try {
      await subscribeToNewsletter({ email, consent: true, countryCode, website })
      setStatus("success")
      onSubscribed()
    } catch {
      setStatus("error")
    } finally {
      submitting.current = false
    }
  }

  return <Dialog
    open={open}
    onClose={onDismiss}
    fullScreen
    aria-labelledby="welcome-title"
    aria-describedby="welcome-description"
    slotProps={{ paper: { sx: screenSx } }}
  >
    <Box sx={{
      display: "flex",
      flexDirection: "column",
      width: "100%",
      maxWidth: 1560,
      minHeight: "100%",
      m: "auto",
      p: {
        xs: "max(20px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left))",
        sm: "28px 40px",
        md: "32px 56px",
        xl: "36px 72px",
      },
    }}>
      <Box component="header" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, "& > span": { minWidth: 0 } }}>
        <Logo tone="light" />
        <HoldButton onConfirm={onDismiss} hint="short" fill={alpha(brand.cyan, .24)} startIcon={<Icon name="close" />} sx={{
          flexShrink: 0,
          p: { xs: "8px", sm: "8px 12px" },
          minHeight: 44,
          color: "brand.onNavyMuted",
          fontSize: { xs: 12, sm: 13 },
          "& .MuiButton-startIcon": { mr: 1 },
          "&:hover": { color: "brand.onNavy", bgcolor: "brand.navy" },
        }}>{ct("Skip for now")}</HoldButton>
      </Box>

      <Box sx={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.1fr) minmax(0, 1fr)" },
        alignContent: "center",
        alignItems: "center",
        gap: { xs: 3.25, sm: 4, md: 8, xl: 11 },
        pt: { xs: 2.5, sm: 4, md: 3.5 },
        pb: { xs: 3.75, sm: 4, md: 3.5 },
        animation: `${arrival} 500ms ease-out both`,
      }}>
        <Box component="figure" sx={{ width: "100%", minWidth: 0, m: { xs: 0, sm: "auto", md: 0 }, maxWidth: { sm: 520, md: "none" } }}>
          <Box sx={{ position: "relative", height: { xs: 175, sm: 235, md: "min(42vh, 430px)" }, filter: "drop-shadow(0 20px 35px rgba(0, 0, 0, .22))" }}>
            <Image
              src="/images/welcome-peptide-building-blocks-blue.webp"
              alt={ct("Illustration of blue building blocks linked into a chain across an open book, representing amino acids forming a peptide.")}
              fill
              preload
              sizes="(min-width: 900px) 650px, (min-width: 600px) 520px, 350px"
              style={{ objectFit: "contain" }}
            />
          </Box>
          <Box component="figcaption" sx={{ display: { xs: "none", md: "block" }, maxWidth: 470, m: "24px auto 0" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2.5, fontWeight: 600, color: "brand.onNavy", fontSize: 13 }}>
              <span>{ct("Amino acids")}</span><Icon name="arrowRight" sx={{ width: 36, color: "brand.cyan" }} /><span>{ct("A peptide chain")}</span>
            </Box>
            <Typography sx={{ mt: 1.5, textAlign: "center", fontSize: 13, lineHeight: 1.75, color: "brand.onNavyMuted" }}>{ct("Peptides are short chains of amino acids, the building blocks of proteins. We'll help you connect the dots.")}</Typography>
          </Box>
        </Box>

        <Box component="section" sx={{ width: "100%", maxWidth: 490, minWidth: 0, mx: "auto" }}>
          <Typography sx={{ mb: { xs: 1.5, md: 2.25 }, color: "brand.cyan", fontSize: { xs: 12, md: 13 }, fontWeight: 600 }}>{ct("The VETUD research newsletter")}</Typography>
          <Typography id="welcome-title" variant="h2" sx={{
            maxWidth: 490,
            mb: 2.25,
            fontSize: { xs: "clamp(36px, 4.4vw, 64px)", sm: 46, md: "clamp(44px, min(4.4vw, 6.7vh), 64px)" },
            lineHeight: 1.08,
            letterSpacing: "-.055em",
          }}>{ct(status === "success" ? "You're on the list." : "Peptide science. Made simple.")}</Typography>

          {status === "success" ? <div role="status" aria-live="polite" aria-atomic="true">
            <Box sx={{ display: "grid", placeItems: "center", width: 52, height: 52, my: 2.75, borderRadius: "50%", bgcolor: "brand.navy", color: "brand.cyan" }}><Icon name="check" sx={{ fontSize: 28 }} /></Box>
            <Typography id="welcome-description" sx={descriptionSx}>{ct("Thanks for signing up to VETUD. We'll email you our latest offers and news.")}</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 3.25 }}>
              <HoldButton variant="contained" fill={alpha(brand.navy, .2)} onConfirm={() => {
                onDismiss()
                router.push(localize("/shop"))
              }} sx={primaryButtonSx}>{actions("shopCatalog")}</HoldButton>
            </Box>
          </div> : <>
            <Typography id="welcome-description" sx={descriptionSx}>{ct("Get VETUD offers and news in your inbox.")}</Typography>
            <Box component="form" ref={form} onSubmit={holdToJoin} noValidate aria-busy={status === "sending"} sx={{ position: "relative", mt: { xs: 3, md: 3.75 } }}>
              <TextField
                label={offerText("email")}
                type="email"
                name="email"
                required
                value={email}
                onChange={event => setEmail(event.target.value)}
                disabled={status === "sending"}
                error={showErrors && emailInvalid}
                helperText={showErrors && emailInvalid ? offerText("invalidEmail") : undefined}
                slotProps={{
                  htmlInput: { autoComplete: "email", inputMode: "email", spellCheck: false, maxLength: 254, autoCapitalize: "none" },
                  input: { sx: emailInputSx },
                  inputLabel: { sx: emailLabelSx },
                  formHelperText: { sx: { "&.Mui-error": { color: "error.light" } } },
                }}
              />
              <Box aria-hidden="true" sx={{ position: "absolute", left: -9999, width: "1px", height: "1px", overflow: "hidden" }}>
                <label>{ct("Leave this field empty")}<input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)} /></label>
              </Box>
              <Box sx={{ mt: 2, p: "4px 12px 4px 4px", border: "1px solid", borderColor: "brand.navySoft", borderRadius: "12px", bgcolor: alpha(brand.onNavy, .03) }}>
                <FormControlLabel
                  sx={{
                    width: "100%",
                    m: 0,
                    alignItems: "flex-start",
                    gap: .5,
                    "& .MuiFormControlLabel-label, & .MuiFormControlLabel-label.Mui-disabled": { minWidth: 0, py: "11px", fontSize: 13, lineHeight: 1.65, color: "brand.onNavyMuted" },
                  }}
                  control={<Checkbox
                    checked={consent}
                    onChange={event => setConsent(event.target.checked)}
                    disabled={status === "sending"}
                    slotProps={{ input: { "aria-invalid": showErrors && !consent, "aria-describedby": showErrors && !consent ? "welcome-consent-error" : undefined } }}
                    sx={{ p: 1, minWidth: 44, minHeight: 44, color: "brand.onNavyMuted", "&.Mui-checked": { color: "brand.cyan" } }}
                  />}
                  label={offerText("consent")}
                />
                {showErrors && !consent ? <FormHelperText error id="welcome-consent-error" sx={{ m: "0 0 8px 48px", lineHeight: 1.6, "&.Mui-error": { color: "error.light" } }}>{ct("Please tick the box to receive our emails.")}</FormHelperText> : null}
              </Box>
              {status === "error" ? <Alert severity="error" sx={{ mt: 2 }}>{ct("We couldn't save your signup. Please try again.")}</Alert> : null}
              <HoldButton ref={joinButton} showHoldTooltip variant="contained" fullWidth size="large" disabled={status === "sending"} onConfirm={() => void submit()} fill={alpha(brand.navy, .2)}
                startIcon={status === "sending" ? <CircularProgress size={18} color="inherit" /> : <Icon name="mail" />}
                counterSx={{ ml: "auto" }}
                sx={{ ...primaryButtonSx, minHeight: 54, mt: 2.5, justifyContent: "center", "& .MuiButton-startIcon": { mr: "auto" } }}>
                {ct(status === "sending" ? "Joining the newsletter..." : "Join the newsletter")}
              </HoldButton>
              <Typography sx={{ mt: 1.5, textAlign: "center", fontSize: 12, lineHeight: 1.6, color: "brand.onNavyMuted" }}>{ct("Free to join. Unsubscribe whenever you like.")}</Typography>
            </Box>
          </>}
        </Box>
      </Box>

      <Box component="footer" sx={{
        display: "grid",
        gridTemplateColumns: { md: "minmax(0, 1fr) auto" },
        alignItems: { md: "center" },
        gap: { xs: 1.5, md: 4 },
        pt: 2.5,
        borderTop: "1px solid",
        borderColor: "brand.navySoft",
        color: "brand.onNavyMuted",
      }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, maxWidth: 650 }}>
          <Icon name="flask" sx={{ flexShrink: 0, width: 20, height: 20, mt: "1px", color: "brand.cyan" }} />
          <Typography sx={{ fontSize: 12, lineHeight: 1.7 }}>
            <Box component="strong" sx={{ display: "block", mb: "3px", color: "brand.onNavy", fontWeight: 600 }}>{ct("For research and education only.")}</Box>
            <span>{ct("Not medical advice. Research peptides are not for human or veterinary use.")}</span>
          </Typography>
        </Box>
        <Box component="nav" aria-label={footerText("legal")} sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: { md: "flex-end" }, gap: "4px 20px" }}>
          <AppLink href="/legal/terms" target="_blank" rel="noopener" sx={legalLinkSx}>{footerText("terms")}</AppLink>
          <AppLink href="/legal/privacy" target="_blank" rel="noopener" sx={legalLinkSx}>{footerText("privacy")}</AppLink>
          <AppLink href="/legal/research-use" target="_blank" rel="noopener" sx={legalLinkSx}>{footerText("research")}</AppLink>
        </Box>
      </Box>
    </Box>
  </Dialog>
}
