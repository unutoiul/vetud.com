"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { brand } from "@/theme/tokens"
import Icon, { type IconName } from "../brand/Icon"
import { useLanguage } from "../common/language"
import { AppLink } from "../common/links"
import { BOOK, bookOfferEmail, startBookCheckout } from "./book"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * The price and the pay button on the book's page. Opened from the email link (?t=…), it already
 * knows the address; opened directly, it asks for one. The button opens Stripe Checkout.
 */
export default function BookBuyBox() {
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

  const trust: { icon: IconName; text: string }[] = [
    { icon: "lock", text: ct("Secure payment with Stripe") },
    { icon: "mail", text: ct("Download link by email") },
    { icon: "document", text: ct("PDF for phone, tablet or computer") },
  ]

  return <Box component="form" id="buy" onSubmit={pay} noValidate aria-busy={status === "sending"} sx={{
    scrollMarginTop: 96,
    p: { xs: 2.5, sm: 3.5 },
    borderRadius: "22px",
    bgcolor: "background.paper",
    border: 1,
    borderColor: "brand.line",
    boxShadow: `0 24px 60px ${brand.navyA10}`,
  }}>
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", columnGap: 1.25, rowGap: .25 }}>
      <Typography sx={{ fontSize: { xs: 40, sm: 46 }, fontWeight: 650, letterSpacing: "-.04em", lineHeight: 1 }}>{BOOK.price}</Typography>
      <Typography sx={{ color: "text.secondary", fontSize: 14 }}>{ct("one-off payment, tax included")}</Typography>
    </Box>

    {linkEmail === undefined ? <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mt: 2.5, color: "text.secondary" }}>
      <CircularProgress size={16} color="inherit" /><Typography sx={{ fontSize: 14 }}>{ct("Checking your link...")}</Typography>
    </Box> : typed ? <Box sx={{ mt: 2.5 }}>
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
        helperText={showErrors && emailInvalid ? offerText("invalidEmail") : ct("We email your download link here.")}
        slotProps={{ htmlInput: { autoComplete: "email", inputMode: "email", spellCheck: false, maxLength: 254, autoCapitalize: "none", placeholder: "name@example.com" } }}
      />
    </Box> : <Box sx={{ mt: 2.5, p: 1.5, borderRadius: "12px", bgcolor: "brand.mintWash", display: "flex", gap: 1.25, alignItems: "center" }}>
      <Icon name="mail" sx={{ fontSize: 20, color: "brand.teal" }} />
      <Typography sx={{ fontSize: 14, lineHeight: 1.5, minWidth: 0 }}>
        {ct("Your download link goes to")} <Box component="strong" sx={{ overflowWrap: "anywhere" }}>{linkEmail}</Box>
      </Typography>
    </Box>}

    {status === "error" ? <Alert severity="error" sx={{ mt: 2 }}>{ct("We couldn't open the checkout. Please try again.")}</Alert> : null}
    <Button type="submit" variant="contained" fullWidth size="large" disabled={linkEmail === undefined || status === "sending"}
      startIcon={status === "sending" ? <CircularProgress size={18} color="inherit" /> : undefined}
      endIcon={status === "sending" ? undefined : <Icon name="arrowRight" />}
      sx={{ mt: 2.5, minHeight: 56, borderRadius: "14px", fontSize: 17, fontWeight: 700 }}>
      {status === "sending" ? ct("Opening secure checkout...") : ct.template("Download PDF for {v0}", { v0: BOOK.price }, { translateValues: false })}
    </Button>

    <Box component="ul" sx={{ listStyle: "none", p: 0, m: "18px 0 0", display: "grid", gap: 1 }}>
      {trust.map(item => <Box component="li" key={item.icon} sx={{ display: "flex", alignItems: "center", gap: 1.25, color: "text.secondary", fontSize: 14 }}>
        <Icon name={item.icon} sx={{ fontSize: 18, color: "brand.blue" }} />{item.text}
      </Box>)}
    </Box>
    <Typography sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "brand.line", color: "text.secondary", fontSize: 12, lineHeight: 1.6 }}>
      {ct("Stripe sells the book for us and sends your receipt.")}{" "}
      <AppLink href="/legal/terms-of-use" target="_blank" rel="noopener">{ct("Terms")}</AppLink>
      {" · "}
      <AppLink href="/legal/privacy" target="_blank" rel="noopener">{footerText("privacy")}</AppLink>
    </Typography>
  </Box>
}
