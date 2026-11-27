"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { useContentTranslator } from "@/i18n/use-content-translator"
import Icon from "../brand/Icon"
import { useLanguage } from "../common/language"
import { AppLink } from "../common/links"
import { bookOfferEmail, startBookCheckout } from "./book"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * The price and the pay button on the book's page. Opened from the email link (?t=…), it already
 * knows the address; opened directly, it asks for one. The button opens Stripe Checkout.
 */
export default function BookBuyBox() {
  const token = useSearchParams().get("t") ?? ""
  return <BookCheckoutForm key={token} token={token} />
}

function BookCheckoutForm({ token }: { token: string }) {
  const ct = useContentTranslator()
  const offerText = useTranslations("Offer")
  const footerText = useTranslations("Footer")
  const language = useLanguage()
  const emailInput = useRef<HTMLInputElement>(null)
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
    if (emailInvalid) {
      emailInput.current?.focus()
      return
    }
    if (linkEmail === undefined || status === "sending") return
    setStatus("sending")
    try {
      window.location.assign(await startBookCheckout(typed ? { email, language } : { token, language }))
    } catch {
      setStatus("error")
    }
  }

  return <Box component="form" aria-label={ct("Buy the PDF")} onSubmit={pay} noValidate aria-busy={status === "sending"}>
    {linkEmail === undefined ? <Box role="status" sx={{ display: "flex", alignItems: "center", gap: 1.25, mt: 2.5, color: "text.secondary" }}>
      <CircularProgress size={16} color="inherit" /><Typography sx={{ fontSize: 14 }}>{ct("Checking your link...")}</Typography>
    </Box> : typed ? <Box sx={{ mt: 2.5 }}>
      {token ? <Alert severity="info" sx={{ mb: 2 }}>{ct("This link has expired. Enter your email address to continue.")}</Alert> : null}
      <TextField
        id="book-email"
        inputRef={emailInput}
        label={offerText("email")}
        type="email"
        name="email"
        required
        fullWidth
        value={email}
        onChange={event => setEmail(event.target.value)}
        disabled={status === "sending"}
        error={showErrors && emailInvalid}
        helperText={showErrors && emailInvalid ? offerText("invalidEmail") : ct("We’ll send your PDF link to this address after payment.")}
        slotProps={{ formHelperText: { "aria-live": "polite" }, htmlInput: { autoComplete: "email", inputMode: "email", spellCheck: false, maxLength: 254, autoCapitalize: "none", placeholder: "name@example.com" } }}
      />
    </Box> : <Box sx={{ mt: 2.5, p: 1.5, borderRadius: "12px", bgcolor: "brand.mintWash", display: "flex", gap: 1.25, alignItems: "center" }}>
      <Icon name="mail" sx={{ fontSize: 20, color: "brand.teal" }} />
      <Typography sx={{ fontSize: 14, lineHeight: 1.5, minWidth: 0 }}>
        {ct("Your download link goes to")} <Box component="strong" sx={{ overflowWrap: "anywhere" }}>{linkEmail}</Box>
      </Typography>
    </Box>}

    {status === "error" ? <Alert severity="error" sx={{ mt: 2 }}>{ct("We couldn't open the checkout. Please try again.")}</Alert> : null}
    <Button type="submit" variant="contained" fullWidth size="large" disabled={linkEmail === undefined || status === "sending"}
      startIcon={status === "sending" ? <CircularProgress size={18} color="inherit" /> : <Icon name="lock" />}
      endIcon={status === "sending" ? undefined : <Icon name="arrowRight" />}
      sx={{ mt: 2, minHeight: 52, borderRadius: "8px", fontSize: 16, fontWeight: 700 }}>
      {status === "sending" ? ct("Opening secure checkout...") : ct("Continue to Stripe checkout")}
    </Button>

    <Typography component="div" sx={{ pt: 1.5, color: "brand.slate625", fontSize: 13, lineHeight: 1.7, "& a": { textDecoration: "underline", textUnderlineOffset: "2px" } }}>
      {ct("Stripe sells the book for us and sends your receipt.")}{" "}
      <AppLink href="/legal/terms-of-use" target="_blank" rel="noopener">{ct("Terms")}</AppLink>
      {" · "}
      <AppLink href="/legal/privacy" target="_blank" rel="noopener">{footerText("privacy")}</AppLink>
    </Typography>
  </Box>
}
