"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import { alpha } from "@mui/material/styles"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { brand } from "@/theme/tokens"
import Icon from "../brand/Icon"
import { useLanguage } from "../common/language"
import { AppLink } from "../common/links"
import { BOOK, bookOfferEmail, startBookCheckout } from "./book"
import BookCover from "./BookCover"
import { bookPanelSx } from "./panel"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const pointSx = { display: "grid", gridTemplateColumns: "22px minmax(0, 1fr)", gap: 1, alignItems: "start", color: "brand.onNavyMuted", fontSize: 15, lineHeight: 1.55 }

const payButtonSx = {
  mt: 3,
  minHeight: 56,
  px: 3.5,
  borderRadius: "14px",
  fontSize: 17,
  fontWeight: 700,
  color: "brand.navyDeep",
  bgcolor: "brand.cyan",
  backgroundImage: `linear-gradient(180deg, ${brand.tealBright}, ${brand.cyan})`,
  boxShadow: `0 10px 28px ${alpha(brand.cyan, .38)}`,
  "&:hover": { bgcolor: "brand.tealBright", backgroundImage: `linear-gradient(180deg, ${brand.mint}, ${brand.tealBright})` },
  "&.Mui-disabled": { bgcolor: "brand.navySoft", backgroundImage: "none", color: "brand.onNavyMuted", boxShadow: "none" },
}

/**
 * The book's page, opened from the link in the first email (?t=…, which carries the address). It
 * shows the book and its price, and the pay button opens Stripe Checkout. Without a valid link, the
 * visitor types their email here instead.
 */
export default function BookOffer() {
  const ct = useContentTranslator()
  const offerText = useTranslations("Offer")
  const footerText = useTranslations("Footer")
  const language = useLanguage()
  const token = useSearchParams().get("t") ?? ""
  // undefined while checking the link; null when there is no valid link.
  const [linkEmail, setLinkEmail] = useState<string | null | undefined>(token ? undefined : null)
  const [email, setEmail] = useState("")
  const [showErrors, setShowErrors] = useState(false)
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle")
  const typed = linkEmail === null
  const emailInvalid = typed && (!EMAIL_PATTERN.test(email.trim()) || email.trim().length > 254)

  useEffect(() => {
    if (!token) return
    let live = true
    bookOfferEmail(token).then(found => { if (live) setLinkEmail(found) }).catch(() => { if (live) setLinkEmail(null) })
    return () => { live = false }
  }, [token])

  const pay = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShowErrors(true)
    if (linkEmail === undefined || emailInvalid || status === "sending") return
    setStatus("sending")
    try {
      window.location.assign(await startBookCheckout(typed ? { email, language } : { token, language }))
    } catch {
      setStatus("error")
    }
  }

  return <Box sx={bookPanelSx}>
    <BookCover alt={ct("Peptides Explained: 32 peptides explained in detail")} sizes="(min-width: 900px) 240px, 190px" priority sx={{ maxWidth: { xs: 160, sm: "none" } }} />
    <Box component="form" onSubmit={pay} noValidate aria-busy={status === "sending"} sx={{ minWidth: 0 }}>
      <Typography sx={{ color: "brand.cyan", fontSize: 13, fontWeight: 600 }}>{ct("PDF book")}</Typography>
      <Typography component="h2" variant="h2" sx={{ mt: 1, fontSize: { xs: 32, sm: 40 }, lineHeight: 1.05, letterSpacing: "-.05em" }}>{BOOK.title}</Typography>
      <Typography sx={{ mt: 1, color: "brand.onNavyMuted", fontSize: 17, lineHeight: 1.55 }}>{ct("32 peptides explained in detail, in plain language.")}</Typography>

      <Box component="ul" sx={{ listStyle: "none", p: 0, m: "20px 0 0", display: "grid", gap: 1 }}>
        {[
          ct("32 peptides, each explained in detail"),
          ct("Written in plain language, for education"),
          ct("A PDF for your phone, tablet or computer"),
          ct("The download link is emailed straight after you pay"),
        ].map(point => <Box component="li" key={point} sx={pointSx}>
          <Icon name="check" sx={{ mt: "3px", fontSize: 18, color: "brand.cyan" }} />{point}
        </Box>)}
      </Box>

      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mt: 3 }}>
        <Typography sx={{ fontSize: 34, fontWeight: 700, letterSpacing: "-.03em" }}>{BOOK.price}</Typography>
        <Typography sx={{ color: "brand.onNavyMuted", fontSize: 14 }}>{ct("USD, one-off payment, tax included")}</Typography>
      </Box>

      {linkEmail === undefined ? <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mt: 2, color: "brand.onNavyMuted" }}>
        <CircularProgress size={16} color="inherit" /><Typography sx={{ fontSize: 14 }}>{ct("Checking your link...")}</Typography>
      </Box> : typed ? <Box sx={{ mt: 2, maxWidth: 420 }}>
        {token ? <Alert severity="info" sx={{ mb: 2 }}>{ct("This link has expired. Enter your email address to continue.")}</Alert> : null}
        <TextField
          label={offerText("email")}
          type="email"
          name="email"
          required
          fullWidth
          value={email}
          onChange={event => setEmail(event.target.value)}
          disabled={status === "sending"}
          error={showErrors && emailInvalid}
          helperText={showErrors && emailInvalid ? offerText("invalidEmail") : ct("We email the download link here.")}
          slotProps={{
            htmlInput: { autoComplete: "email", inputMode: "email", spellCheck: false, maxLength: 254, autoCapitalize: "none", placeholder: "name@example.com" },
            input: { sx: { bgcolor: alpha(brand.onNavy, .06), "& input": { color: "brand.onNavy" } } },
            inputLabel: { sx: { color: "brand.onNavy", "&.Mui-focused": { color: "brand.onNavy" } } },
            formHelperText: { sx: { color: "brand.onNavyMuted", "&.Mui-error": { color: "error.light" } } },
          }}
        />
      </Box> : <Typography sx={{ mt: 1.5, color: "brand.onNavyMuted", fontSize: 14 }}>
        {ct("We'll email the download link to")} <Box component="strong" sx={{ color: "brand.onNavy", overflowWrap: "anywhere" }}>{linkEmail}</Box>
      </Typography>}

      {status === "error" ? <Alert severity="error" sx={{ mt: 2 }}>{ct("We couldn't open the checkout. Please try again.")}</Alert> : null}
      <Button type="submit" variant="contained" size="large" disabled={linkEmail === undefined || status === "sending"}
        startIcon={status === "sending" ? <CircularProgress size={18} color="inherit" /> : undefined}
        endIcon={status === "sending" ? undefined : <Icon name="arrowRight" />}
        sx={payButtonSx}>
        {ct(status === "sending" ? "Opening secure checkout..." : `Download PDF for ${BOOK.price}`)}
      </Button>
      <Typography sx={{ mt: 1.5, color: "brand.onNavyMuted", fontSize: 12, lineHeight: 1.6 }}>
        {ct("Secure payment by Stripe, which sells the book for us and sends your receipt.")}{" "}
        <AppLink href="/legal/terms-of-use" target="_blank" rel="noopener" sx={{ color: "brand.cyan" }}>{ct("Terms")}</AppLink>
        {" · "}
        <AppLink href="/legal/privacy" target="_blank" rel="noopener" sx={{ color: "brand.cyan" }}>{footerText("privacy")}</AppLink>
      </Typography>
    </Box>
  </Box>
}
