"use client"

import { CheckOutlined, CloseOutlined, CopyOutlined, LockOutlined, ShoppingOutlined } from "@ant-design/icons"
import { App, Button, Flex, Form, Grid, Input, Modal, Typography } from "antd"
import { useState } from "react"
import { OFFER, PRODUCTS, bestCombinedPercent } from "@/config/site"
import { around, format } from "@/i18n/format"
import { EMAIL_PATTERN, LIMITS, orderTotal } from "@/lib/order"
import { colors, fonts, gradients } from "@/theme/tokens"
import { useCountry } from "./CountryProvider"
import { useMessages } from "./MessagesProvider"
import { useOrder } from "./OrderProvider"
import Image from "next/image"

/** "Extra 10% off": subscribe with an email, get the code on screen and by email. */
export default function PromoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { savePromoCode, openOrder, promoCode } = useOrder()
  const { message } = App.useApp()
  const m = useMessages()
  const t = m.promo
  const [headlineBefore, headlineAfter] = around(t.headline, "percent")
  const screens = Grid.useBreakpoint()
  const [sending, setSending] = useState(false)
  const [code, setCode] = useState<string | null>(promoCode)
  const [copied, setCopied] = useState(false)

  // A concrete example of what the code is worth: the best seller at 40 mg, in the visitor's currency.
  const { country, money } = useCountry()
  const example = orderTotal("retatrutide", "40mg", 1, true, country)

  async function subscribe(values: { email: string; website?: string }) {
    setSending(true)
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...values, country }),
      })
      const data = (await res.json().catch(() => ({}))) as { code?: string; error?: string }
      if (!res.ok || !data.code) {
        message.error(data.error || t.genericError)
        return
      }
      setCode(data.code)
      savePromoCode(data.code)
    } catch {
      message.error(t.noConnection)
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
      message.info(format(t.yourCode, { code }))
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
        <Image src={PRODUCTS.retatrutide.art} alt="" fill sizes="520px" style={{ objectFit: "cover", objectPosition: "center 55%" }} />
        <div aria-hidden style={{ position: "absolute", inset: 0, background: gradients.nightScrim }} />
        <Flex vertical align="center" justify="center" style={{ position: "relative", height: "100%", textAlign: "center", padding: "0 24px" }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase", color: colors.limeLight }}>
            {code ? t.eyebrowReady : t.eyebrow}
          </div>
          <div style={{ fontFamily: fonts.display, fontWeight: 300, fontSize: screens.sm ? 58 : 46, lineHeight: 1, color: colors.white, marginTop: 10 }}>
            {headlineBefore}
            <span
              style={{
                fontWeight: 500,
                backgroundImage: gradients.glowText,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: colors.green,
              }}
            >
              {OFFER.subscriberPercent}%
            </span>
            {headlineAfter}
          </div>
          <div style={{ color: colors.onNavyMuted, fontSize: 14, marginTop: 10 }}>
            {format(t.onTop, { saleLabel: m.offer.saleLabel, percent: OFFER.salePercent, best: bestCombinedPercent() })}
          </div>
        </Flex>
      </div>

      <div style={{ padding: pad, background: colors.white }}>
        {code ? (
          <Flex vertical gap={16}>
            <Typography.Paragraph style={{ color: colors.muted, fontSize: 15, margin: 0, textAlign: "center" }}>
              {t.emailedNote}
            </Typography.Paragraph>
            <button
              type="button"
              onClick={copy}
              aria-label={format(t.copyAria, { code })}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "16px 20px",
                border: `1.5px dashed ${colors.green}`,
                borderRadius: 14,
                background: colors.limeWash,
                cursor: "pointer",
              }}
            >
              <span style={{ fontFamily: fonts.mono, fontSize: 26, fontWeight: 500, letterSpacing: "0.2em", color: colors.navy }}>{code}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: colors.sale }}>
                {copied ? <CheckOutlined /> : <CopyOutlined />}
                {copied ? t.copied : t.copy}
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
              {t.orderWithCode}
            </Button>
          </Flex>
        ) : (
          <>
            {/* What the code is worth, in the visitor's currency */}
            <Flex
              align="center"
              justify="space-between"
              gap={12}
              style={{ padding: "12px 16px", borderRadius: 14, background: colors.aquaWash, border: `1px solid ${colors.line}`, marginBottom: 22 }}
            >
              <div style={{ fontSize: 13, color: colors.muted, lineHeight: 1.4 }}>
                <div style={{ color: colors.navyInk, fontWeight: 600 }}>{format(t.exampleTitle, { product: PRODUCTS.retatrutide.name })}</div>
                {t.exampleNote}
              </div>
              <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                <span style={{ color: colors.muted, textDecoration: "line-through", fontSize: 14, marginRight: 8 }}>{money(example.regular)}</span>
                <span style={{ fontFamily: fonts.display, fontSize: 26, fontWeight: 600, color: colors.navy }}>{money(example.total)}</span>
              </div>
            </Flex>

            <Form layout="vertical" requiredMark={false} onFinish={subscribe}>
              <Form.Item
                name="email"
                label={<span style={{ fontWeight: 600 }}>{t.emailLabel}</span>}
                rules={[{ required: true, pattern: EMAIL_PATTERN, message: t.emailError }]}
                style={{ marginBottom: 14 }}
              >
                <Input size="large" type="email" autoComplete="email" inputMode="email" placeholder={t.emailPlaceholder} maxLength={LIMITS.email} />
              </Form.Item>
              <Form.Item name="website" hidden>
                <Input tabIndex={-1} autoComplete="off" />
              </Form.Item>
              <Button type="primary" htmlType="submit" size="large" block loading={sending} icon={<LockOutlined />} style={{ height: 54, fontSize: 16 }}>
                {format(t.reveal, { percent: OFFER.subscriberPercent })}
              </Button>
            </Form>
            <Typography.Paragraph style={{ color: colors.muted, fontSize: 12, margin: "14px 0 0", textAlign: "center" }}>
              {t.consent}
            </Typography.Paragraph>
            <Flex justify="center">
              <Button type="link" onClick={onClose} style={{ color: colors.muted, fontSize: 13, height: 36 }}>
                {t.noThanks}
              </Button>
            </Flex>
          </>
        )}
      </div>
    </Modal>
  )
}
