"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import CircularProgress from "@mui/material/CircularProgress"
import Dialog from "@mui/material/Dialog"
import { alpha, keyframes, type SxProps, type Theme } from "@mui/material/styles"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useTranslations } from "next-intl"
import { useRef, useState, type FormEvent } from "react"
import { getArticle } from "@/content/learn/articles"
import { getLearnIllustration } from "@/content/learn/illustrations"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { brand } from "@/theme/tokens"
import Icon from "../brand/Icon"
import Logo from "../brand/Logo"
import { AppLink } from "../common/links"
import { subscribeToEmailList } from "../newsletter/subscription"
import { useLanguage } from "../common/language"
import Button from "@mui/material/Button"
import HoldButton from "./HoldButton"
import NewsletterPreview from "./NewsletterPreview"
import SplashBackdrop from "./SplashBackdrop"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Real stories from the site, shown in the newsletter preview. */
const PREVIEW_ARTICLES = ["retatrutide-triumph-1-28-percent", "bpc-157-human-evidence", "copper-peptides-hair-growth"]

const arrival = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`

// A soft light that sweeps across the join button now and then, so it reads as something to press.
const shine = keyframes`
  0%, 55% { transform: translateX(-110%); }
  100% { transform: translateX(110%); }
`

// A centred window over the page (not a full screen), so the site stays in view behind it.
const screenSx: SxProps<Theme> = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  width: { xs: "calc(100% - 24px)", sm: "calc(100% - 48px)" },
  maxWidth: 1120,
  maxHeight: { xs: "calc(100% - 24px)", sm: "calc(100% - 48px)" },
  m: { xs: 1.5, sm: 3 },
  borderRadius: { xs: "20px", md: "28px" },
  color: "brand.onNavy",
  bgcolor: "brand.navyDeep",
  backgroundImage: `radial-gradient(ellipse at 22% 46%, ${alpha(brand.blue, .42)}, transparent 65%)`,
  border: `1px solid ${alpha(brand.cyan, .22)}`,
  boxShadow: `0 40px 120px ${brand.blackA22}`,
  overflow: "hidden",
  // The theme's blue focus ring is too faint on this navy screen.
  "& a:focus-visible, & button:focus-visible": { outline: `2px solid ${brand.cyan}`, outlineOffset: 4 },
}

const descriptionSx: SxProps<Theme> = { maxWidth: 450, color: "brand.onNavyMuted", fontSize: { xs: 15, sm: 16 }, lineHeight: 1.75 }

/** The success screen's plain Close button. */
const primaryButtonSx = {
  bgcolor: "brand.mintLight",
  color: "brand.navy",
  "&:hover": { bgcolor: "brand.onNavy" },
  "&.Mui-disabled": { bgcolor: "brand.navySoft", color: "brand.onNavyMuted" },
}

/**
 * The join button: bright, raised and glowing on the navy window, with an arrow, so it can't be
 * mistaken for the email field above it. It lifts on hover and presses in when tapped.
 */
const joinButtonSx: SxProps<Theme> = {
  position: "relative",
  overflow: "hidden",
  minHeight: { xs: 52, sm: 56 },
  mt: { xs: 1.5, md: 2.5 },
  justifyContent: "center",
  borderRadius: "14px",
  fontSize: { xs: 16, sm: 17 },
  fontWeight: 700,
  letterSpacing: "-.01em",
  color: "brand.navyDeep",
  bgcolor: "brand.cyan",
  backgroundImage: `linear-gradient(180deg, ${brand.tealBright}, ${brand.cyan})`,
  boxShadow: `0 10px 28px ${alpha(brand.cyan, .38)}, inset 0 1px 0 ${alpha(brand.white, .6)}`,
  transition: "transform .15s ease, box-shadow .2s ease",
  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    backgroundImage: `linear-gradient(105deg, transparent 30%, ${alpha(brand.white, .55)} 50%, transparent 70%)`,
    transform: "translateX(-110%)",
    animation: `${shine} 4s 1.5s ease-in-out infinite`,
    pointerEvents: "none",
  },
  "& .MuiButton-endIcon": { ml: 1, transition: "transform .2s ease", "& svg": { width: 20, height: 20 } },
  "&:hover": {
    bgcolor: "brand.tealBright",
    backgroundImage: `linear-gradient(180deg, ${brand.mint}, ${brand.tealBright})`,
    boxShadow: `0 14px 34px ${alpha(brand.cyan, .5)}, inset 0 1px 0 ${alpha(brand.white, .7)}`,
    transform: "translateY(-1px)",
  },
  "&:hover .MuiButton-endIcon": { transform: "translateX(3px)" },
  "&:active": { transform: "translateY(1px) scale(.99)", boxShadow: `0 4px 12px ${alpha(brand.cyan, .3)}` },
  "&.Mui-disabled": { bgcolor: "brand.navySoft", backgroundImage: "none", color: "brand.onNavyMuted", boxShadow: "none", "&::after": { display: "none" } },
  "@media (prefers-reduced-motion: reduce)": { "&::after": { display: "none" } },
}

const emailInputSx: SxProps<Theme> = {
  bgcolor: alpha(brand.onNavy, .06),
  "& input": { color: "brand.onNavy", "&::placeholder": { color: "brand.onNavyMuted", opacity: .7 } },
  "& input:-webkit-autofill": { WebkitTextFillColor: brand.onNavy, boxShadow: `0 0 0 40px ${brand.navy} inset`, caretColor: brand.onNavy },
  "& .MuiOutlinedInput-notchedOutline, &.Mui-disabled .MuiOutlinedInput-notchedOutline": { borderColor: alpha(brand.cyan, .32) },
  "&:hover:not(.Mui-disabled):not(.Mui-focused)": { bgcolor: alpha(brand.onNavy, .09) },
  "&:hover:not(.Mui-disabled):not(.Mui-error) .MuiOutlinedInput-notchedOutline": { borderColor: alpha(brand.cyan, .6) },
  "&.Mui-focused": { bgcolor: alpha(brand.onNavy, .09), boxShadow: `0 0 0 4px ${alpha(brand.cyan, .18)}` },
  "&.Mui-focused:not(.Mui-error) .MuiOutlinedInput-notchedOutline": { borderColor: "brand.cyan" },
  "&.Mui-error .MuiOutlinedInput-notchedOutline": { borderColor: "error.light" },
  "&.Mui-error.Mui-focused": { boxShadow: `0 0 0 4px ${alpha(brand.cyan, .12)}` },
}

const emailLabelSx: SxProps<Theme> = {
  color: "brand.onNavy",
  "&.Mui-focused, &.Mui-error": { color: "brand.onNavy" },
  "&.Mui-disabled": { color: "brand.onNavyMuted" },
}

const privacyLinkSx: SxProps<Theme> = {
  whiteSpace: "nowrap",
  color: "brand.cyan",
  textUnderlineOffset: "3px",
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
  const language = useLanguage()
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [showErrors, setShowErrors] = useState(false)
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const submitting = useRef(false)
  const form = useRef<HTMLFormElement>(null)
  const emailInvalid = !EMAIL_PATTERN.test(email.trim()) || email.trim().length > 254

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submit()
  }

  const submit = async () => {
    if (submitting.current) return
    setShowErrors(true)
    if (emailInvalid) {
      form.current?.querySelector<HTMLInputElement>('input[type="email"]')?.focus()
      return
    }
    submitting.current = true
    setStatus("sending")
    try {
      await subscribeToEmailList({ email, consent: true, language, website })
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
    // Escape still closes it (accessibility); a click on the page around it doesn't, like every other way out.
    onClose={(_, reason) => { if (reason !== "backdropClick") onDismiss() }}
    maxWidth={false}
    aria-labelledby="welcome-title"
    aria-describedby="welcome-description"
    slotProps={{ paper: { sx: screenSx }, backdrop: { sx: { bgcolor: alpha(brand.navyDeep, .55), backdropFilter: "blur(6px)" } } }}
  >
    <SplashBackdrop primary="/images/learn/spotlights/retatrutide.webp" secondary="/images/learn/spotlights/tirzepatide.webp" />
    {/* The logo and "Skip for now" stay put at the top; only the content below scrolls on short screens. */}
    <Box component="header" sx={{
      position: "relative",
      zIndex: 2,
      flexShrink: 0,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 2,
      p: { xs: "12px 16px 4px", sm: "22px 32px 4px", md: "24px 40px 4px" },
      "& > span": { minWidth: 0 },
    }}>
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
      position: "relative",
      zIndex: 1,
      display: "flex",
      flexDirection: "column",
      minHeight: 0,
      overflowY: "auto",
      p: { xs: "0 16px 16px", sm: "0 32px 24px", md: "0 40px 28px" },
    }}>
      <Box sx={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.1fr) minmax(0, 1fr)" },
        alignContent: "center",
        alignItems: "center",
        gap: { xs: 2, sm: 3, md: 5 },
        pt: { xs: 1, md: 1 },
        pb: { xs: 0, md: 1 },
        animation: `${arrival} 500ms ease-out both`,
      }}>
        {/* Phones get just the headline and the form, so it all fits on small iPhones. */}
        <NewsletterPreview
          sx={{ display: { xs: "none", sm: "grid" } }}
          label={ct("Preview of the VETUD newsletter: recent stories, written in plain language.")}
          subject={ct("The latest from VETUD")}
          stories={PREVIEW_ARTICLES.flatMap(slug => {
            const article = getArticle(slug)
            const image = getLearnIllustration(slug)
            return article && image ? [{ kicker: ct(article.kind), title: ct(article.headline.join("")), image: image.src }] : []
          })}
          chips={[ct("Plain language"), ct("Every number sourced"), ct("Unsubscribe anytime")]}
        />

        <Box component="section" sx={{ width: "100%", maxWidth: 490, minWidth: 0, mx: "auto" }}>
          <Typography sx={{ mb: { xs: .75, md: 2.25 }, color: "brand.cyan", fontSize: { xs: 12, md: 13 }, fontWeight: 600 }}>{ct("The VETUD research newsletter")}</Typography>
          <Typography id="welcome-title" variant="h2" sx={{
            maxWidth: 490,
            mb: status === "success" ? 2.25 : 0,
            fontSize: { xs: "clamp(26px, 7.6vw, 30px)", sm: 42, md: "clamp(40px, 3.6vw, 52px)" },
            lineHeight: 1.08,
            letterSpacing: "-.055em",
          }}>{ct(status === "success" ? "Check your inbox." : "Peptide science. Made simple.")}</Typography>

          {status === "success" ? <div role="status" aria-live="polite" aria-atomic="true">
            <Box sx={{ display: "grid", placeItems: "center", width: 52, height: 52, my: 2.75, borderRadius: "50%", bgcolor: "brand.navy", color: "brand.cyan" }}><Icon name="check" sx={{ fontSize: 28 }} /></Box>
            <Typography id="welcome-description" sx={descriptionSx}>{ct("We've sent you a link to confirm your email. Explore our peptide guides and meet the community in the meantime.")}</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 3.25 }}>
              <Button variant="contained" onClick={onDismiss} sx={primaryButtonSx}>{actions("close")}</Button>
            </Box>
          </div> : <>
            <Box component="form" ref={form} onSubmit={handleSubmit} noValidate aria-busy={status === "sending"} sx={{ position: "relative", mt: { xs: 2, md: 3.75 } }}>
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
                  htmlInput: { autoComplete: "email", inputMode: "email", spellCheck: false, maxLength: 254, autoCapitalize: "none", placeholder: "name@example.com" },
                  input: { sx: emailInputSx },
                  inputLabel: { sx: emailLabelSx },
                  formHelperText: { sx: { "&.Mui-error": { color: "error.light" } } },
                }}
              />
              <Box aria-hidden="true" sx={{ position: "absolute", left: -9999, width: "1px", height: "1px", overflow: "hidden" }}>
                <label>{ct("Leave this field empty")}<input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)} /></label>
              </Box>
              {status === "error" ? <Alert severity="error" sx={{ mt: 2 }}>{ct("We couldn't save your signup. Please try again.")}</Alert> : null}
              <Button type="submit" variant="contained" fullWidth size="large" disabled={status === "sending"}
                startIcon={status === "sending" ? <CircularProgress size={18} color="inherit" /> : undefined}
                endIcon={status === "sending" ? undefined : <Icon name="arrowRight" />}
                sx={joinButtonSx}>
                {ct(status === "sending" ? "Joining the newsletter..." : "Join the newsletter")}
              </Button>
              {/* An email sign-up still says where its privacy terms are: one small link on this line. */}
              <Typography id="welcome-description" sx={{ mt: { xs: 1, md: 1.5 }, textAlign: "center", fontSize: 12, lineHeight: 1.6, color: "brand.onNavyMuted" }}>
                {ct("Free to join. Unsubscribe whenever you like.")}{" "}
                <AppLink href="/legal/privacy" target="_blank" rel="noopener" sx={privacyLinkSx}>{footerText("privacy")}</AppLink>
              </Typography>
            </Box>
          </>}
        </Box>
      </Box>
    </Box>
  </Dialog>
}
