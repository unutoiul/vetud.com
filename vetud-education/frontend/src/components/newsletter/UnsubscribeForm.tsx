"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Typography from "@mui/material/Typography"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { sdk } from "@/lib/medusa/sdk"

/**
 * Unsubscribing takes one click on this page rather than happening on page load,
 * so email scanners that open links can't unsubscribe anyone by accident.
 */
export default function UnsubscribeForm() {
  const t = useTranslations("Offer")
  const params = useSearchParams()
  const email = params.get("email") ?? ""
  const token = params.get("token") ?? ""
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(email && token ? "idle" : "error")

  const unsubscribe = async () => {
    setStatus("sending")
    try {
      await sdk.client.fetch("/store/email-list/unsubscribe", { method: "POST", body: { email, token } })
      setStatus("done")
    } catch {
      setStatus("error")
    }
  }

  return (
    <Box sx={{ maxWidth: 560 }}>
      {status === "done" ? <Alert severity="success" role="status">{t("unsubscribed")}</Alert>
        : status === "error" ? <Alert severity="warning">{t("unsubscribeError")}</Alert>
        : <>
          <Typography sx={{ color: "text.secondary", fontSize: 17, lineHeight: 1.7, overflowWrap: "anywhere" }}>{t("unsubscribeBody", { email })}</Typography>
          <Button variant="contained" size="large" onClick={() => void unsubscribe()} disabled={status === "sending"} startIcon={status === "sending" ? <CircularProgress size={16} color="inherit" /> : undefined} sx={{ mt: 3 }}>{t("unsubscribeButton")}</Button>
        </>}
    </Box>
  )
}
