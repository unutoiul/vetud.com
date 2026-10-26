"use client"

import { useEffect, useEffectEvent, useRef, useState } from "react"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Checkbox from "@mui/material/Checkbox"
import CircularProgress from "@mui/material/CircularProgress"
import FormControlLabel from "@mui/material/FormControlLabel"
import MenuItem from "@mui/material/MenuItem"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { formatMoney } from "@/lib/product"
import type { NmiSession, NmiToken } from "@/lib/nmi"

type Collect = { configure: (options: Record<string, unknown>) => void; startPaymentRequest: () => void }
declare global { interface Window { CollectJS?: Collect } }

const FIELDS = {
  card: { ccnumber: "Card number", ccexp: "Expiry (MM / YY)", cvv: "Security code" },
  ach: { checkname: "Name on bank account", checkaba: "Routing number", checkaccount: "Account number" },
}

export default function NmiPaymentForm({ session, busy, onToken }: { session: NmiSession; busy: boolean; onToken: (token: NmiToken) => Promise<void> }) {
  const [method, setMethod] = useState<"card" | "ach">("card")
  return <Stack spacing={2} sx={{ mt: 3 }}>
    <Typography variant="h6">Secure payment details</Typography>
    {session.sandbox ? <Alert severity="warning">Sandbox checkout — use NMI test details only.</Alert> : null}
    {session.ach ? <TextField select label="Payment type" value={method} disabled={busy} onChange={(event) => setMethod(event.target.value === "ach" ? "ach" : "card")}>
      <MenuItem value="card">Credit / debit card</MenuItem><MenuItem value="ach">US bank account (ACH)</MenuItem>
    </TextField> : null}
    <HostedFields key={`${session.id}:${method}`} session={session} method={method} busy={busy} onToken={onToken} />
  </Stack>
}

function HostedFields({ session, method, busy, onToken }: { session: NmiSession; method: "card" | "ach"; busy: boolean; onToken: (token: NmiToken) => Promise<void> }) {
  const [ready, setReady] = useState(false)
  const [validity, setValidity] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [accountType, setAccountType] = useState<"" | "checking" | "savings">("")
  const [holderType, setHolderType] = useState<"" | "personal" | "business">("")
  const [consent, setConsent] = useState(false)
  const activeRequest = useRef(false)
  const attempted = useRef(false)
  const pendingConsent = useRef<Pick<NmiToken, "account_type" | "account_holder_type" | "ach_authorized">>({})
  const requestTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const { tokenizationKey, sandbox, amount, currency, country } = session
  const fields = FIELDS[method]
  const amountLabel = formatMoney(amount, currency)
  const receiveToken = useEffectEvent(async (response: { token?: unknown }) => {
    if (!activeRequest.current) return
    activeRequest.current = false
    clearTimeout(requestTimeout.current)
    if (typeof response.token !== "string" || !response.token || response.token.length > 1024) {
      setProcessing(false)
      setError("Your payment details could not be secured. Please check the fields.")
      return
    }
    // Do not keep tokens, card metadata or bank details in state/storage/logs.
    attempted.current = true
    setSubmitted(true)
    try { await onToken({ payment_token: response.token, payment_method: method, ...pendingConsent.current }) }
    finally { setProcessing(false) }
  })

  useEffect(() => {
    let active = true
    const fieldConfig = Object.fromEntries(Object.entries(FIELDS[method]).map(([name, title]) => [name, { selector: `#vetud-nmi-${name}`, title, placeholder: title }]))
    // Collect.js requires a fresh instance when switching hosted-field layouts.
    // next/script caches execution across remounts; use a scoped loader here.
    const script = document.createElement("script")
    script.src = `https://${sandbox ? "sandbox" : "secure"}.nmi.com/token/Collect.js`
    script.dataset.tokenizationKey = tokenizationKey
    script.async = true
    const fail = () => {
      if (!active) return
      activeRequest.current = false
      setProcessing(false)
      setReady(false)
      setError("Secure payment fields could not connect. Check your connection, then return to Payment to reload them.")
    }
    const loadTimeout = setTimeout(fail, 20000)
    script.onerror = fail
    script.onload = () => {
      if (!active) return
      if (!window.CollectJS) { fail(); return }
      try {
        window.CollectJS.configure({
          variant: "inline", tokenizationKey, paymentType: method === "ach" ? "ck" : "cc",
          fields: fieldConfig, price: amount.toFixed(2), currency, country,
          styleSniffer: false,
          customCss: { "font-size": "16px", "font-family": "Arial, sans-serif", padding: "14px", "box-sizing": "border-box", "background-color": "#ffffff", color: "#172b36" },
          invalidCss: { color: "#b42318" }, timeoutDuration: 15000,
          timeoutCallback: fail,
          fieldsAvailableCallback: () => { if (active) { clearTimeout(loadTimeout); setReady(true); setError(null) } },
          validationCallback: (field: string, valid: boolean) => { if (active) setValidity((value) => ({ ...value, [field]: valid })) },
          callback: (response: { token?: unknown }) => { if (active) void receiveToken(response) },
        })
      } catch { fail() }
    }
    document.head.appendChild(script)
    return () => {
      active = false
      activeRequest.current = false
      clearTimeout(loadTimeout)
      clearTimeout(requestTimeout.current)
      script.onload = null
      script.onerror = null
      script.remove()
      delete window.CollectJS
    }
  }, [tokenizationKey, sandbox, method, amount, currency, country])

  const valid = ready && Object.keys(fields).every((name) => validity[name] === true)
    && (method === "card" || (consent && accountType && holderType))
  const locked = busy || processing || submitted
  return <Stack spacing={2}>
    <Typography variant="body2" color="text.secondary">{method === "card" ? "Card details are securely collected by NMI. We use the billing address you already entered." : "Bank details are securely collected by NMI. Bank debits can take several business days to settle; your order will be held until then."}</Typography>
    <Box aria-busy={!ready} sx={{ pointerEvents: locked ? "none" : "auto" }}>
      {Object.entries(fields).map(([name, title]) => <Box key={name} sx={{ mb: 1.5 }}>
        <Typography id={`vetud-nmi-label-${name}`} variant="body2" sx={{ mb: 0.75 }}>{title}</Typography>
        <Box id={`vetud-nmi-${name}`} aria-labelledby={`vetud-nmi-label-${name}`} sx={{ minHeight: 52, border: "1px solid", borderColor: validity[name] === false ? "error.main" : "divider", borderRadius: 1.5, bgcolor: "#fff", overflow: "hidden", "& iframe": { display: "block", width: "100%", border: 0 } }} />
        {validity[name] === false ? <Typography variant="caption" color="error">Check this field.</Typography> : null}
      </Box>)}
    </Box>
    {method === "ach" ? <>
      <TextField select label="Account type" value={accountType} disabled={locked} onChange={(event) => { setAccountType(event.target.value as "checking" | "savings"); setConsent(false) }} required>
        <MenuItem value="checking">Checking</MenuItem><MenuItem value="savings">Savings</MenuItem>
      </TextField>
      <TextField select label="Account holder" value={holderType} disabled={locked} onChange={(event) => { setHolderType(event.target.value as "personal" | "business"); setConsent(false) }} required>
        <MenuItem value="personal">Personal</MenuItem><MenuItem value="business">Business</MenuItem>
      </TextField>
      <FormControlLabel control={<Checkbox checked={consent} disabled={locked} onChange={(event) => setConsent(event.target.checked)} />} label={`I authorize Vetud Peptides to initiate one ACH debit of ${amountLabel} from this account for this order and confirm I am authorized to use it. This is not a recurring payment.${holderType === "business" ? " For this business account, I agree to be bound by the applicable Nacha Operating Rules." : ""}`} />
    </> : null}
    {error ? <Alert severity="error">{error}</Alert> : null}
    {submitted && !busy && !processing ? <Alert severity="info">Your payment attempt was submitted. Check the message above and your order history before trying again. If you need to change payment details, return to the Payment step.</Alert> : null}
    <Button variant="contained" size="large" disabled={!valid || locked} startIcon={!ready || processing || busy ? <CircularProgress size={16} color="inherit" /> : undefined} onClick={() => {
      if (!valid || locked || activeRequest.current || attempted.current || !window.CollectJS) return
      activeRequest.current = true
      pendingConsent.current = method === "ach" ? { account_type: accountType as "checking" | "savings", account_holder_type: holderType as "personal" | "business", ach_authorized: consent } : {}
      setError(null)
      setProcessing(true)
      requestTimeout.current = setTimeout(() => {
        if (!activeRequest.current) return
        activeRequest.current = false
        setProcessing(false)
        setReady(false)
        setError("Tokenization timed out. No payment token was sent by this form. Return to Payment to reload the secure fields.")
      }, 18000)
      try { window.CollectJS.startPaymentRequest() } catch { activeRequest.current = false; clearTimeout(requestTimeout.current); setProcessing(false); setError("The secure payment form could not start. Return to Payment to reload it.") }
    }}>{processing || busy ? "Processing securely…" : !ready ? "Loading secure fields…" : `${method === "ach" ? "Authorize debit" : "Authorize card"} & place order · ${amountLabel}`}</Button>
  </Stack>
}
