"use client"

import { Alert, Button, Typography } from "antd"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { colors } from "@/theme/tokens"

/**
 * One click to unsubscribe, rather than on page load, so email scanners that open links can't
 * unsubscribe anyone by accident.
 */
export default function UnsubscribeForm() {
  const params = useSearchParams()
  const email = params.get("email") ?? ""
  const token = params.get("token") ?? ""
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(email && token ? "idle" : "error")
  const [message, setMessage] = useState("This link isn't valid. Please use the link from your latest email.")

  const unsubscribe = async () => {
    setStatus("sending")
    const response = await fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, token }),
    }).catch(() => null)
    if (response?.ok) {
      setStatus("done")
      return
    }
    const body = (await response?.json().catch(() => null)) as { error?: string } | null
    if (body?.error) setMessage(body.error)
    setStatus("error")
  }

  return (
    <>
      <Typography.Title level={1} style={{ fontSize: 30, color: colors.navy, marginTop: 0 }}>
        Unsubscribe
      </Typography.Title>
      {status === "done" ? (
        <Alert type="success" showIcon title="Done. You won't get offers or news from us anymore." />
      ) : status === "error" ? (
        <Alert type="warning" showIcon title={message} />
      ) : (
        <>
          <Typography.Paragraph style={{ fontSize: 17, color: colors.muted, overflowWrap: "anywhere" }}>
            Press the button and we&apos;ll stop sending offers and news to {email}.
          </Typography.Paragraph>
          <Button type="primary" size="large" loading={status === "sending"} onClick={() => void unsubscribe()}>
            Unsubscribe
          </Button>
        </>
      )}
    </>
  )
}
