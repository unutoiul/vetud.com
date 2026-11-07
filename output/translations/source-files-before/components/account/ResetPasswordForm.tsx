"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import Icon from "../brand/Icon"
import { ButtonLink } from "../common/links"
import { useStore } from "../store/StoreProvider"
import { PasswordField, ResetRequestForm } from "./AccountPage"
import { useAccount } from "./AccountProvider"

type ResetStatus = "form" | "expired" | "done" | "signedIn"

function isUnauthorized(error: unknown) {
  return Boolean(error && typeof error === "object" && "status" in error && error.status === 401)
}

/** Sets a new password from the emailed link, then signs the customer in. */
export default function ResetPasswordForm() {
  const t = useTranslations("Account")
  const params = useSearchParams()
  const token = params.get("token") ?? ""
  const email = params.get("email") ?? ""
  const { resetPassword, signIn, pending, clearError } = useAccount()
  const { itemCount } = useStore()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showErrors, setShowErrors] = useState(false)
  const [status, setStatus] = useState<ResetStatus>(token ? "form" : "expired")
  const [formError, setFormError] = useState<string | null>(null)

  const passwordError = password.length < 8 ? t("invalidPassword") : undefined
  const confirmError = confirm !== password ? t("passwordsMismatch") : undefined

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShowErrors(true)
    setFormError(null)
    if (passwordError || confirmError) return
    try {
      await resetPassword(password, token)
    } catch (caught) {
      clearError()
      if (isUnauthorized(caught)) setStatus("expired")
      else setFormError(caught instanceof Error ? caught.message : t("resetExpired"))
      return
    }
    try {
      if (email) {
        await signIn(email, password)
        setStatus("signedIn")
        return
      }
    } catch {
      // The password is saved; the customer can sign in from the account page.
      clearError()
    }
    setStatus("done")
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3, maxWidth: 560 }}>
      {status === "expired" ? (
        <>
          <Alert severity="warning" sx={{ mb: 3 }}>{token ? t("resetExpired") : t("resetMissing")}</Alert>
          <ResetRequestForm initialEmail={email} />
        </>
      ) : status === "done" || status === "signedIn" ? (
        <Stack spacing={3} sx={{ alignItems: "flex-start" }}>
          <Alert severity="success" role="status" sx={{ alignSelf: "stretch" }}>
            {status === "signedIn" ? t("resetDone") : t("resetDoneSignin")}
          </Alert>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}>
            {status === "signedIn" && itemCount ? (
              <ButtonLink href="/checkout" variant="contained" startIcon={<Icon name="lock" sx={{ fontSize: 17 }} />}>{t("continueCheckout")}</ButtonLink>
            ) : null}
            <ButtonLink href="/account" variant={status === "signedIn" && itemCount ? "outlined" : "contained"}>
              {status === "signedIn" ? t("goToAccount") : t("signin")}
            </ButtonLink>
          </Stack>
        </Stack>
      ) : (
        <Box component="form" onSubmit={submit} noValidate>
          {email ? <Typography sx={{ color: "text.secondary", mb: 3, overflowWrap: "anywhere" }}>{t("resetFor", { email })}</Typography> : null}
          {formError ? <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert> : null}
          <Stack spacing={2}>
            <PasswordField
              label={t("newPassword")}
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              error={showErrors && Boolean(passwordError)}
              helperText={showErrors && passwordError ? passwordError : t("passwordHelp")}
            />
            <PasswordField
              label={t("confirmPassword")}
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              error={showErrors && Boolean(confirmError)}
              helperText={showErrors ? confirmError : undefined}
            />
          </Stack>
          <Button type="submit" variant="contained" size="large" disabled={pending} startIcon={pending ? <CircularProgress size={16} color="inherit" /> : <Icon name="lock" sx={{ fontSize: 17 }} />} sx={{ mt: 3, width: { xs: "100%", sm: "auto" } }}>
            {t("savePassword")}
          </Button>
        </Box>
      )}
    </Paper>
  )
}
