"use client"

import { CheckOutlined, CloseOutlined, CopyOutlined, LockOutlined, ShoppingOutlined } from "@ant-design/icons"
import { App, Button, Flex, Form, Grid, Input, Modal, Typography } from "antd"
import { useState } from "react"
import { OFFER, PRODUCTS, bestCombinedPercent, formatUsd } from "@/config/site"
import { EMAIL_PATTERN, LIMITS, orderTotal } from "@/lib/order"
import { colors, fonts, gradients } from "@/theme/tokens"
import { useOrder } from "./OrderProvider"
import Ribbons from "./Ribbons"

/** "Extra 10% off": subscribe with an email, get the code on screen and by email. */
export default function PromoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { savePromoCode, openOrder, promoCode } = useOrder()
  const { message } = App.useApp()
  const screens = Grid.useBreakpoint()
  const [sending, setSending] = useState(false)
  const [code, setCode] = useState<string | null>(promoCode)
  const [copied, setCopied] = useState(false)

  // A concrete example of what the code is worth: the best seller at 40 mg.
  const example = orderTotal("retatrutide", "40mg", 1, true)

  async function subscribe(values: { email: string; website?: string }) {
    setSending(true)
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      })
      const data = (await res.json().catch(() => ({}))) as { code?: string; error?: string }
      if (!res.ok || !data.code) {
        message.error(data.error || "Something went wrong. Please try again.")
        return
      }
      setCode(data.code)
      savePromoCode(data.code)
    } catch {
      message.error("No connection. Please try again.")
    } finally {
      setSending(false)
    }
  }

  async function copy() {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      message.info(`Your code: ${code}`)
    }
  }

  const pad = screens.sm ? "32px 40px 36px" : "24px 22px 28px"

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={screens.sm ? 520 : "calc(100% - 24px)"}
      styles={{ container: { padding: 0, overflow: "hidden", borderRadius: 24 }, body: { padding: 0 } }}
      closeIcon={<CloseOutlined style={{ color: colors.onNavy, fontSize: 16 }} />}
    >
      {/* Night header with the glass ribbons */}
      <div style={{ position: "relative", background: gradients.night, height: screens.sm ? 210 : 180, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: "-10% -20% -30% -20%", opacity: 0.9 }}>
          <Ribbons />
        </div>
        <div aria-hidden style={{ position: "absolute", inset: 0, background: gradients.nightScrim }} />
        <Flex vertical align="center" justify="center" style={{ position: "relative", height: "100%", textAlign: "center", padding: "0 24px" }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase", color: colors.goldLight }}>
            {code ? "Your code is ready" : "Subscriber exclusive"}
          </div>
          <div style={{ fontFamily: fonts.display, fontWeight: 300, fontSize: screens.sm ? 58 : 46, lineHeight: 1, color: colors.white, marginTop: 10 }}>
            Extra{" "}
            <span
              style={{
                fontWeight: 500,
                backgroundImage: gradients.champagneText,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: colors.gold,
              }}
            >
              {OFFER.subscriberPercent}%
            </span>{" "}
            off
          </div>
          <div style={{ color: colors.onNavyMuted, fontSize: 14, marginTop: 10 }}>
            On top of the {OFFER.salePercent}% {OFFER.saleLabel.toLowerCase()} · up to {bestCombinedPercent()}% off in total
          </div>
        </Flex>
      </div>

      <div style={{ padding: pad, background: colors.white }}>
        {code ? (
          <Flex vertical gap={16}>
            <Typography.Paragraph style={{ color: colors.muted, fontSize: 15, margin: 0, textAlign: "center" }}>
              We&apos;ve also emailed it to you, and it&apos;s already applied to your order form.
            </Typography.Paragraph>
            <button
              type="button"
              onClick={copy}
              aria-label={`Copy code ${code}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "16px 20px",
                border: `1.5px dashed ${colors.gold}`,
                borderRadius: 14,
                background: colors.goldWash,
                cursor: "pointer",
              }}
            >
              <span style={{ fontFamily: fonts.mono, fontSize: 26, fontWeight: 500, letterSpacing: "0.2em", color: colors.navy }}>{code}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: colors.sale }}>
                {copied ? <CheckOutlined /> : <CopyOutlined />}
                {copied ? "Copied" : "Copy"}
              </span>
            </button>
            <Button
              type="primary"
              size="large"
              block
              icon={<ShoppingOutlined />}
              onClick={() => {
                onClose()
                openOrder()
              }}
              style={{ height: 54, fontSize: 16 }}
            >
              Order now with my code
            </Button>
          </Flex>
        ) : (
          <>
            {/* What the code is worth, in dollars */}
            <Flex
              align="center"
              justify="space-between"
              gap={12}
              style={{ padding: "12px 16px", borderRadius: 14, background: colors.iceWash, border: `1px solid ${colors.line}`, marginBottom: 22 }}
            >
              <div style={{ fontSize: 13, color: colors.muted, lineHeight: 1.4 }}>
                <div style={{ color: colors.navyInk, fontWeight: 600 }}>{PRODUCTS.retatrutide.name} 40 mg</div>
                Best seller, with your code
              </div>
              <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                <span style={{ color: colors.muted, textDecoration: "line-through", fontSize: 14, marginRight: 8 }}>{formatUsd(example.regular)}</span>
                <span style={{ fontFamily: fonts.display, fontSize: 26, fontWeight: 600, color: colors.navy }}>{formatUsd(example.total)}</span>
              </div>
            </Flex>

            <Form layout="vertical" requiredMark={false} onFinish={subscribe}>
              <Form.Item
                name="email"
                label={<span style={{ fontWeight: 600 }}>Your email</span>}
                rules={[{ required: true, pattern: EMAIL_PATTERN, message: "Enter a valid email." }]}
                style={{ marginBottom: 14 }}
              >
                <Input size="large" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" maxLength={LIMITS.email} />
              </Form.Item>
              <Form.Item name="website" hidden>
                <Input tabIndex={-1} autoComplete="off" />
              </Form.Item>
              <Button type="primary" htmlType="submit" size="large" block loading={sending} icon={<LockOutlined />} style={{ height: 54, fontSize: 16 }}>
                Reveal my {OFFER.subscriberPercent}% code
              </Button>
            </Form>
            <Typography.Paragraph style={{ color: colors.muted, fontSize: 12, margin: "14px 0 0", textAlign: "center" }}>
              You&apos;ll get VETUD offers by email. Unsubscribe any time.
            </Typography.Paragraph>
            <Flex justify="center">
              <Button type="link" onClick={onClose} style={{ color: colors.muted, fontSize: 13, height: 36 }}>
                No thanks
              </Button>
            </Flex>
          </>
        )}
      </div>
    </Modal>
  )
}
