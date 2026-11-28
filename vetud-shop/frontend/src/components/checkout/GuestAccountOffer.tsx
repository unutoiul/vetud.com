"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useEffect, useState } from "react"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { sdk } from "@/lib/medusa/sdk"
import { useAccount } from "../account/AccountProvider"
import { ButtonLink } from "../common/links"

function errorText(error: unknown) {
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message)
  return "Something went wrong. Please try again."
}

/**
 * After a guest order: keep it in an account. There are no passwords (owner, 2026-11-19): we email
 * a 6-digit code to the order's address, and entering it signs the shopper in (making the account
 * the first time) and adds the order. A signed-in member with the same email just adds it. The
 * browser proves it placed the order with the order's cart, saved at checkout; this works for 24 hours.
 *
 * An order placed with the email of an existing account is filed in that account when it's placed
 * (owner, 2026-11-20: the email is all you need), so then this only says where to find it.
 */
export default function GuestAccountOffer({
  orderId,
  email,
  cartId,
  onAdded,
}: {
  orderId: string
  email: string
  cartId: string
  onAdded: () => void
}) {
  const ct = useContentTranslator()
  const { customer, requestCode, verifyCode } = useAccount()
  const [codeSent, setCodeSent] = useState(false)
  const [code, setCode] = useState("")
  const [wait, setWait] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** Whether the order is already in an account; null while checking. */
  const [inAccount, setInAccount] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    sdk.client
      .fetch<{ in_account: boolean }>(`/store/guest-orders/${encodeURIComponent(orderId)}/account`, {
        query: { cart_id: cartId },
      })
      .then((result) => {
        if (!cancelled) setInAccount(result.in_account)
      })
      // If the check fails, offer the account as before; adding the order then says what's wrong.
      .catch(() => {
        if (!cancelled) setInAccount(false)
      })
    return () => {
      cancelled = true
    }
  }, [orderId, cartId])

  useEffect(() => {
    if (wait <= 0) return
    const timer = window.setTimeout(() => setWait((seconds) => seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [wait])

  const addOrder = () =>
    sdk.client.fetch<{ email: string; account_created: boolean }>(
      `/store/guest-orders/${encodeURIComponent(orderId)}/account`,
      { method: "POST", body: { cart_id: cartId } },
    )

  const task = async (work: () => Promise<void>) => {
    setError(null)
    setBusy(true)
    try {
      await work()
    } catch (caught) {
      setError(errorText(caught))
    } finally {
      setBusy(false)
    }
  }

  const sendCode = () =>
    task(async () => {
      setWait((await requestCode(email)).resendAfter)
      setCode("")
      setCodeSent(true)
    })

  const createAccount = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(code.replace(/\D/g, ""))) {
      setError("Enter the 6-digit code from the email.")
      return
    }
    void task(async () => {
      await verifyCode(email, code)
      await addOrder()
      onAdded()
    })
  }

  const addToAccount = () =>
    task(async () => {
      await addOrder()
      onAdded()
    })

  const spinner = busy ? <CircularProgress size={16} color="inherit" /> : undefined
  if (inAccount === null) return null
  if (inAccount) {
    return (
      <Alert
        severity="success"
        sx={{ mb: 4 }}
        action={
          customer ? undefined : (
            <ButtonLink href="/account" color="inherit" size="small" sx={{ whiteSpace: "nowrap" }}>
              {ct("Sign in")}
            </ButtonLink>
          )
        }
      >
        {customer
          ? ct("This order is in your account, where you can follow it.")
          : ct.rich(
              "This order is saved in the account for <slot0>{v0}</slot0>. Sign in with that email any time to follow it.",
              { v0: email },
              { slot0: (chunks) => <strong key="slot0">{chunks}</strong> },
            )}
      </Alert>
    )
  }
  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, mb: 4 }}>
      <Typography variant="eyebrow" sx={{ color: "secondary.main" }}>
        {ct("Optional")}
      </Typography>
      <Typography variant="h5" component="h3" sx={{ mt: 1 }}>
        {ct(customer ? "Add this order to your account" : "Create an account for next time")}
      </Typography>
      <Typography sx={{ color: "text.secondary", mt: 1, mb: 2.5 }}>
        {customer
          ? ct("Keep this order with your others, so you can follow it from your account.")
          : ct.rich(
              "We'll email a 6-digit code to <slot0>{v0}</slot0>. Enter it here and your account is ready, with this order in it. No password needed.",
              { v0: email },
              { slot0: (chunks) => <strong key="slot0">{chunks}</strong> },
            )}
      </Typography>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {ct(error)}
        </Alert>
      ) : null}
      {customer ? (
        <Button
          variant="contained"
          size="large"
          disabled={busy}
          onClick={() => void addToAccount()}
          startIcon={spinner}
        >
          {ct("Add to my account")}
        </Button>
      ) : !codeSent ? (
        <Button variant="contained" size="large" disabled={busy} onClick={() => void sendCode()} startIcon={spinner}>
          {ct("Email me a code")}
        </Button>
      ) : (
        <Box component="form" onSubmit={createAccount} noValidate>
          <Alert severity="info" role="status" sx={{ mb: 2 }}>
            {ct("Check your email for the code. It works for 10 minutes.")}
          </Alert>
          <TextField
            label={ct("Sign-in code")}
            required
            autoFocus
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/[^\d ]/g, "").slice(0, 7))}
            slotProps={{
              htmlInput: {
                autoComplete: "one-time-code",
                inputMode: "numeric",
                maxLength: 7,
                sx: { letterSpacing: "0.3em", fontVariantNumeric: "tabular-nums", fontSize: 20 },
              },
            }}
          />
          <Stack
            direction={{ xs: "column", sm: "row" }}
            useFlexGap
            spacing={1}
            sx={{ mt: 2, alignItems: { sm: "center" }, flexWrap: "wrap" }}
          >
            <Button type="submit" variant="contained" size="large" disabled={busy} startIcon={spinner}>
              {ct("Create my account")}
            </Button>
            <Button type="button" disabled={busy || wait > 0} onClick={() => void sendCode()} sx={{ minHeight: 44 }}>
              {wait > 0 ? ct.template("Send a new code in {v0} s", { v0: wait }) : ct("Send a new code")}
            </Button>
          </Stack>
        </Box>
      )}
    </Paper>
  )
}
