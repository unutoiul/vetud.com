"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Typography from "@mui/material/Typography"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { sdk } from "@/lib/medusa/sdk"

/**
 * Confirming takes one click on this page rather than happening on page load,
 * so email scanners that open links can't confirm anyone by accident.
 */
export default function ConfirmForm() {
  const ct = useContentTranslator()
  const params = useSearchParams()
  const email = params.get("email") ?? ""
  const expires = params.get("expires") ?? ""
  const token = params.get("token") ?? ""
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(email && expires && token ? "idle" : "error")

  const confirm = async () => {
    setStatus("sending")
    try {
      await sdk.client.fetch("/store/email-list/confirm", { method: "POST", body: { email, expires, token } })
      setStatus("done")
    } catch {
      setStatus("error")
    }
  }

  return (
    <Box sx={{ maxWidth: 560 }}>
      {status === "done" ? <Alert severity="success" role="status">{ct("You're on the list. We'll email you when there are new guides and answered questions.")}</Alert>
        : status === "error" ? <Alert severity="warning">{ct("This confirmation link isn't valid any more. Please sign up again.")}</Alert>
        : <>
          <Typography sx={{ color: "text.secondary", fontSize: 17, lineHeight: 1.7, overflowWrap: "anywhere" }}>{ct.template("Press the button to confirm {v0} for VETUD emails.", { v0: email }, { translateValues: false })}</Typography>
          <Button variant="contained" size="large" onClick={() => void confirm()} disabled={status === "sending"} startIcon={status === "sending" ? <CircularProgress size={16} color="inherit" /> : undefined} sx={{ mt: 3 }}>{ct("Confirm my sign-up")}</Button>
        </>}
    </Box>
  )
}
