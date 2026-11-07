"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Checkbox from "@mui/material/Checkbox"
import CircularProgress from "@mui/material/CircularProgress"
import Dialog from "@mui/material/Dialog"
import FormControlLabel from "@mui/material/FormControlLabel"
import FormHelperText from "@mui/material/FormHelperText"
import IconButton from "@mui/material/IconButton"
import Link from "@mui/material/Link"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { useEffect, useState } from "react"
import { sdk } from "@/lib/medusa/sdk"
import Icon from "../brand/Icon"
import { useLocalizedHref } from "../common/links"
import { useAccount } from "../account/AccountProvider"
import { useStore } from "../store/StoreProvider"

type Offer = { id: string; headline: string; description: string | null; discount: string; ends_at: string | null }

const DELAY_MS = 8000
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// No interruptions while someone is buying or managing their account.
const QUIET_PATHS = /\/(cart|checkout|account|order|newsletter)(\/|$)/

/** Set in this browser once someone subscribes; they never see the pop-up again. */
const SUBSCRIBED_KEY = "vetud_newsletter"
const offerKey = (id: string) => `vetud_offer_${id}`

function subscribed(id: string) {
  try {
    // Older sign-ups were recorded per offer.
    return window.localStorage.getItem(SUBSCRIBED_KEY) === "subscribed" || window.localStorage.getItem(offerKey(id)) === "subscribed"
  } catch {
    return false
  }
}

/** "No thanks" lasts for this visit (this tab); the pop-up asks again on the next one. */
function closedThisVisit(id: string) {
  try {
    return window.sessionStorage.getItem(offerKey(id)) === "closed"
  } catch {
    return false
  }
}

function remember(storage: "local" | "session", key: string, value: string) {
  try {
    (storage === "local" ? window.localStorage : window.sessionStorage).setItem(key, value)
  } catch {
    // Without storage the pop-up may show again sooner; nothing else depends on it.
  }
}

function Countdown({ endsAt }: { endsAt: string }) {
  const t = useTranslations("Offer")
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const left = Math.max(0, new Date(endsAt).getTime() - now)
  const parts = [
    [Math.floor(left / 86_400_000), t("days")],
    [Math.floor(left / 3_600_000) % 24, t("hours")],
    [Math.floor(left / 60_000) % 60, t("minutes")],
    [Math.floor(left / 1000) % 60, t("seconds")],
  ] as const
  return (
    <Box role="timer" aria-label={`${t("endsIn")} ${parts.map(([value, label]) => `${value} ${label}`).join(", ")}`} sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1 }}>
      {parts.map(([value, label]) => (
        <Box key={label} aria-hidden sx={{ textAlign: "center", py: 1.25, borderRadius: "10px", border: "1px solid", borderColor: "divider", bgcolor: "brand.mintWash" }}>
          <Typography sx={{ fontSize: 24, fontWeight: 700, color: "brand.navy", lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}>{String(value).padStart(2, "0")}</Typography>
          <Typography sx={{ fontSize: 11, color: "text.secondary", fontWeight: 600 }}>{label}</Typography>
        </Box>
      ))}
    </Box>
  )
}

/**
 * Sign-up pop-up for the current Medusa offer (a campaign whose identifier starts with "popup-").
 * Everyone who hasn't subscribed sees it on every visit, after a short delay; closing it hides it
 * until the next visit. Never on cart, checkout or account pages, and never for subscribers
 * (in this browser, or signed in with marketing consent). The code itself is only sent by email.
 */
export default function OfferPopup() {
  const t = useTranslations("Offer")
  const pathname = usePathname()
  const localize = useLocalizedHref()
  const { countryCode } = useStore()
  const { customer } = useAccount()
  const consented = customer?.metadata?.marketing_consent === true
  const [offer, setOffer] = useState<Offer | null>(null)
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState("")
  const [showErrors, setShowErrors] = useState(false)
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  useEffect(() => {
    if (QUIET_PATHS.test(pathname) || consented) return
    let cancelled = false
    const timer = window.setTimeout(async () => {
      try {
        const { offer: current } = await sdk.client.fetch<{ offer: Offer | null }>("/store/newsletter/offer", { method: "GET" })
        if (cancelled || !current || subscribed(current.id) || closedThisVisit(current.id) || (current.ends_at && new Date(current.ends_at).getTime() <= Date.now())) return
        setOffer(current)
        setOpen(true)
      } catch {
        // No offer is shown if the backend can't be reached.
      }
    }, DELAY_MS)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [pathname, consented])

  if (!offer) return null

  const emailError = EMAIL_PATTERN.test(email.trim()) ? undefined : t("invalidEmail")
  const close = () => {
    setOpen(false)
    if (status !== "sent") remember("session", offerKey(offer.id), "closed")
  }
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShowErrors(true)
    if (emailError || !consent) return
    setStatus("sending")
    try {
      await sdk.client.fetch("/store/newsletter", { method: "POST", body: { email: email.trim(), consent: true, country_code: countryCode, ...(website ? { website } : {}) } })
      remember("local", SUBSCRIBED_KEY, "subscribed")
      setStatus("sent")
    } catch {
      setStatus("error")
    }
  }

  return (
    <Dialog open={open} onClose={close} maxWidth="xs" fullWidth aria-labelledby="offer-title" slotProps={{ paper: { sx: { borderRadius: "20px", overflow: "hidden", m: 2, maxHeight: "calc(100% - 32px)" } } }}>
      <Box sx={{ position: "relative", height: 132, bgcolor: "brand.navy" }}>
        <Image src="/images/vetud-alpine-landscape.webp" alt="" fill sizes="440px" style={{ objectFit: "cover", objectPosition: "center 80%", opacity: .55 }} />
        <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(21,38,94,.85), rgba(21,38,94,.15))" }} />
        <IconButton aria-label={t("close")} onClick={close} sx={{ position: "absolute", top: 10, right: 10, color: "#fff", bgcolor: "rgba(10,20,48,.45)", "&:hover": { bgcolor: "rgba(10,20,48,.7)" } }}><Icon name="close" /></IconButton>
        <Typography sx={{ position: "absolute", left: 24, bottom: 16, px: 1.5, py: .5, borderRadius: 999, bgcolor: "rgba(255,255,255,.16)", color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: ".06em" }}>{offer.headline || t("label")}</Typography>
      </Box>

      <Box sx={{ p: { xs: 2.5, sm: 3 }, overflowY: "auto" }}>
        {status === "sent" ? (
          <Box role="status" sx={{ textAlign: "center", py: 2 }}>
            <Icon name="mail" sx={{ fontSize: 40, color: "brand.blue" }} />
            <Typography id="offer-title" component="h2" sx={{ mt: 1.5, fontSize: 24, fontWeight: 700, letterSpacing: "-.02em" }}>{t("successTitle")}</Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.7 }}>{t("successBody", { discount: offer.discount, email: email.trim() })}</Typography>
            <Button variant="contained" onClick={close} sx={{ mt: 3 }}>{t("close")}</Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={submit} noValidate>
            <Typography id="offer-title" component="h2" sx={{ fontSize: { xs: 26, sm: 30 }, fontWeight: 700, letterSpacing: "-.03em", lineHeight: 1.15 }}>{t("cta", { discount: offer.discount })}</Typography>
            {offer.description ? <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.65 }}>{offer.description}</Typography> : null}
            {offer.ends_at ? <Box sx={{ mt: 2.5 }}><Typography sx={{ fontSize: 13, fontWeight: 650, color: "text.secondary", mb: 1 }}>{t("endsIn")}</Typography><Countdown endsAt={offer.ends_at} /></Box> : null}
            <TextField sx={{ mt: 2.5 }} label={t("email")} type="email" name="email" required value={email} onChange={(event) => setEmail(event.target.value)} error={showErrors && Boolean(emailError)} helperText={showErrors ? emailError : undefined} slotProps={{ htmlInput: { autoComplete: "email", spellCheck: false } }} />
            {/* Honeypot: hidden from people, filled by bots. */}
            <Box aria-hidden sx={{ position: "absolute", left: -9999, width: 1, height: 1, overflow: "hidden" }}>
              <input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
            </Box>
            <FormControlLabel
              sx={{ mt: 1.5, alignItems: "flex-start", mr: 0 }}
              control={<Checkbox checked={consent} onChange={(event) => setConsent(event.target.checked)} sx={{ pt: .5 }} />}
              label={<Typography variant="body2" sx={{ lineHeight: 1.6 }}>{t("consent")} <Link href={localize("/legal/privacy")} target="_blank" rel="noopener">{t("privacy")}</Link></Typography>}
            />
            {showErrors && !consent ? <FormHelperText error>{t("consentRequired")}</FormHelperText> : null}
            {status === "error" ? <Alert severity="error" sx={{ mt: 1.5 }}>{t("error")}</Alert> : null}
            <Button type="submit" variant="contained" size="large" fullWidth disabled={status === "sending"} startIcon={status === "sending" ? <CircularProgress size={16} color="inherit" /> : <Icon name="mail" />} sx={{ mt: 2.5, minHeight: 52 }}>
              {status === "sending" ? t("sending") : t("cta", { discount: offer.discount })}
            </Button>
            <Button onClick={close} fullWidth sx={{ mt: 1, color: "text.secondary" }}>{t("noThanks")}</Button>
          </Box>
        )}
      </Box>
    </Dialog>
  )
}
