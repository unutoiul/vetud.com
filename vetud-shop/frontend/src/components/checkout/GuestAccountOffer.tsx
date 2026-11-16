"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Paper from "@mui/material/Paper"
import Typography from "@mui/material/Typography"
import { useState } from "react"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { sdk } from "@/lib/medusa/sdk"
import { AuthPanel, PasswordField } from "../account/AccountPage"
import { useAccount } from "../account/AccountProvider"

function errorText(error: unknown) {
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message)
  return "Something went wrong. Please try again."
}

/**
 * After a guest order: create an account with a password and keep this order in it, or, when there
 * already is an account for this email, sign in and add the order to it. The browser proves it placed
 * the order with the order's cart, saved at checkout; this works for 24 hours. The page shows the
 * confirmation once the order has moved.
 */
export default function GuestAccountOffer({ orderId, email, cartId, onAdded }: {
  orderId: string
  email: string
  cartId: string
  onAdded: () => void
}) {
  const ct = useContentTranslator()
  const { customer, signIn } = useAccount()
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingAccount, setExistingAccount] = useState(false)

  const addOrder = (body: { cart_id: string; password?: string }) =>
    sdk.client.fetch<{ email: string; account_created: boolean }>(`/store/guest-orders/${encodeURIComponent(orderId)}/account`, { method: "POST", body })

  const createAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError("Use at least 8 characters.")
      return
    }
    setBusy(true)
    try {
      await addOrder({ cart_id: cartId, password })
      await signIn(email, password)
      onAdded()
    } catch (caught) {
      const message = errorText(caught)
      if (/already an account/i.test(message)) setExistingAccount(true)
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  const addToAccount = async () => {
    setError(null)
    setBusy(true)
    try {
      await addOrder({ cart_id: cartId })
      onAdded()
    } catch (caught) {
      setError(errorText(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, mb: 4 }}>
      <Typography variant="eyebrow" sx={{ color: "secondary.main" }}>{ct("Optional")}</Typography>
      <Typography variant="h5" component="h3" sx={{ mt: 1 }}>
        {ct(customer ? "Add this order to your account" : "Create an account for next time")}
      </Typography>
      <Typography sx={{ color: "text.secondary", mt: 1, mb: 2.5 }}>
        {customer
          ? ct("Keep this order with your others, so you can follow it from your account.")
          : ct.rich("Choose a password to create an account for <slot0>{v0}</slot0>. You'll be able to follow this order and check out faster next time.", { v0: email }, { slot0: (chunks) => <strong key="slot0">{chunks}</strong> })}
      </Typography>
      {error ? <Alert severity={existingAccount && !customer ? "info" : "error"} sx={{ mb: 2 }}>{ct(error)}</Alert> : null}
      {customer ? (
        <Button variant="contained" size="large" disabled={busy} onClick={() => void addToAccount()} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}>
          {ct("Add to my account")}
        </Button>
      ) : existingAccount ? (
        <AuthPanel context="checkout" />
      ) : (
        <Box component="form" onSubmit={createAccount} noValidate>
          {/* Lets password managers save the new password under the right email. */}
          <Box component="input" type="email" name="email" autoComplete="username" value={email} readOnly tabIndex={-1} aria-hidden sx={{ display: "none" }} />
          <PasswordField label={ct("Choose a password")} value={password} onChange={setPassword} autoComplete="new-password" helperText={ct("At least 8 characters.")} />
          <Button type="submit" variant="contained" size="large" disabled={busy} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined} sx={{ mt: 2 }}>
            {ct("Create my account")}
          </Button>
        </Box>
      )}
    </Paper>
  )
}
