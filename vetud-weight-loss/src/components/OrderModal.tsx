"use client"

import { CheckCircleFilled, GiftFilled, LockOutlined, MailOutlined, SafetyCertificateOutlined, ThunderboltOutlined } from "@ant-design/icons"
import { App, Button, Checkbox, Col, Divider, Flex, Form, Grid, Input, InputNumber, Modal, Radio, Result, Row, Segmented, Select, Space, Typography } from "antd"
import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import { MAX_QUANTITY, OFFER, PRODUCT_IDS, PRODUCTS, SITE, STRENGTHS, contactLinks, formatUsd, priceOf, strengthLabel, type ProductId, type Strength } from "@/config/site"
import { COUNTRY_OPTIONS } from "@/lib/countries"
import { CONTACT_APP_LABELS, CONTACT_APPS, EMAIL_PATTERN, LIMITS, PHONE_PATTERN, orderTotal, type ContactApp } from "@/lib/order"
import { colors, fonts } from "@/theme/tokens"
import { CONTACT_COLORS, ContactIcon } from "./icons/ContactIcon"
import { useOrder } from "./OrderProvider"

type FormValues = {
  product: ProductId
  strength: Strength
  quantity: number
  name: string
  email: string
  phone: string
  contactApp: ContactApp
  contactHandle?: string
  country?: string
  address: string
  city: string
  postalCode: string
  note?: string
  researchUse: boolean
  website?: string
}

const HANDLE_HINT: Record<ContactApp, string> = {
  whatsapp: "WhatsApp number, if different from your phone",
  telegram: "Your Telegram username, e.g. @name",
  line: "Your LINE ID",
  email: "",
}

export default function OrderModal({
  open,
  initial,
  onClose,
}: {
  open: boolean
  initial: { product: ProductId; strength: Strength }
  onClose: () => void
}) {
  const [form] = Form.useForm<FormValues>()
  const { message } = App.useApp()
  const screens = Grid.useBreakpoint()
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<{ orderNumber: string; email: string; total: number } | null>(null)
  const { promoCode, openPromo } = useOrder()
  // null = untouched: the visitor's saved subscriber code (if any) is shown and applied.
  const [codeInput, setCodeInput] = useState<string | null>(null)
  const [manualCode, setManualCode] = useState<string | null>(null)
  const appliedCode = codeInput === null ? promoCode : manualCode
  const inputValue = codeInput ?? promoCode ?? ""
  const [checkingCode, setCheckingCode] = useState(false)

  const product = Form.useWatch("product", form) ?? initial.product
  const strength = Form.useWatch("strength", form) ?? initial.strength
  const quantity = Form.useWatch("quantity", form) ?? 1
  const contactApp = Form.useWatch("contactApp", form) ?? "whatsapp"
  const safeQuantity = Math.min(Math.max(Number(quantity) || 1, 1), MAX_QUANTITY)
  const amounts = orderTotal(product, strength, safeQuantity, !!appliedCode)
  const { total } = amounts

  const applyCode = useCallback(
    async (raw: string, quiet = false) => {
      const code = raw.trim().toUpperCase()
      if (!code) return
      setCheckingCode(true)
      try {
        const res = await fetch("/api/promo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) })
        const data = (await res.json().catch(() => ({}))) as { valid?: boolean }
        if (data.valid) {
          setManualCode(code)
          setCodeInput(code)
          if (!quiet) message.success(`Code ${code} applied: extra ${OFFER.subscriberPercent}% off`)
        } else if (!quiet) {
          message.error("That code isn't valid.")
        }
      } catch {
        if (!quiet) message.error("Couldn't check the code. Please try again.")
      } finally {
        setCheckingCode(false)
      }
    },
    [message],
  )


  // Each time the form opens, start from the pen the visitor clicked.
  useEffect(() => {
    if (!open) return
    form.setFieldsValue({ product: initial.product, strength: initial.strength })
  }, [open, initial.product, initial.strength, form])

  async function submit(values: FormValues) {
    setSubmitting(true)
    // Read everything from the submitted values: a field committed on blur (the quantity box) may not
    // have re-rendered this component yet.
    const all = { ...form.getFieldsValue(true), ...values } as FormValues
    const submittedQuantity = Math.min(Math.max(Math.round(Number(all.quantity) || 1), 1), MAX_QUANTITY)
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...all, quantity: submittedQuantity, promoCode: appliedCode ?? "", researchUse: all.researchUse === true }),
      })
      const data = (await res.json().catch(() => ({}))) as { orderNumber?: string; total?: number; error?: string; fields?: Record<string, string> }
      if (!res.ok || !data.orderNumber) {
        if (data.fields) {
          form.setFields(Object.entries(data.fields).map(([name, error]) => ({ name: name as keyof FormValues, errors: [error] })))
        }
        message.error(data.error || "Something went wrong. Please try again or message us.")
        return
      }
      setDone({ orderNumber: data.orderNumber, email: all.email, total: data.total ?? orderTotal(all.product, all.strength, submittedQuantity, !!appliedCode).total })
      form.resetFields(["note", "quantity"])
    } catch {
      message.error("No connection. Please try again or message us.")
    } finally {
      setSubmitting(false)
    }
  }

  const selected = PRODUCTS[product]
  const contacts = contactLinks()

  return (
    <Modal
      open={open}
      onCancel={onClose}
      afterClose={() => setDone(null)}
      footer={null}
      width={screens.md ? 920 : "100%"}
      centered={screens.md}
      destroyOnHidden={false}
      title={null}
      styles={{
        container: { padding: 0, overflow: "hidden" },
        body: { padding: 0 },
      }}
      style={screens.md ? undefined : { top: 0, maxWidth: "100%", margin: 0, paddingBottom: 0 }}
    >
      {done ? (
        <div style={{ padding: "48px clamp(20px, 5vw, 56px)" }}>
          <Result
            icon={<CheckCircleFilled style={{ color: colors.success }} />}
            title={<span style={{ fontFamily: fonts.display, fontSize: 30, color: colors.navy }}>Order {done.orderNumber} is reserved</span>}
            subTitle={
              <span style={{ fontSize: 16, lineHeight: 1.6 }}>
                We sent the payment details to <strong>{done.email}</strong>. Total to pay: <strong>{formatUsd(done.total)}</strong>.
                <br />
                Can&apos;t find it? Check your spam folder or message us below.
              </span>
            }
            extra={
              <Flex wrap gap={12} justify="center">
                {contacts.map((link) => (
                  <Button
                    key={link.key}
                    size="large"
                    href={link.href}
                    target={link.key === "email" ? undefined : "_blank"}
                    icon={<ContactIcon kind={link.key} style={{ color: CONTACT_COLORS[link.key] }} />}
                  >
                    {link.label}
                  </Button>
                ))}
                <Button size="large" type="primary" onClick={onClose}>
                  Done
                </Button>
              </Flex>
            }
          />
        </div>
      ) : (
        <Form<FormValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={submit}
          initialValues={{ product: initial.product, strength: initial.strength, quantity: 1, contactApp: "whatsapp", researchUse: false }}
          scrollToFirstError
        >
          <Row>
            {/* Left: the pen, the strength and the total */}
            <Col xs={24} md={10} style={{ background: colors.iceWash, borderRight: screens.md ? `1px solid ${colors.line}` : undefined }}>
              <div style={{ padding: "28px clamp(20px, 3vw, 32px)" }}>
                <div style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: colors.blueSoft }}>
                  Your order
                </div>
                <Flex align="center" gap={16} style={{ margin: "16px 0 20px" }}>
                  <div style={{ width: 88, height: 88, position: "relative", flex: "none", borderRadius: 14, background: colors.white, border: `1px solid ${colors.line}` }}>
                    <Image src={selected.image} alt={selected.fullName} fill sizes="88px" style={{ objectFit: "contain", padding: 4 }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: fonts.display, fontSize: 22, color: colors.navy, lineHeight: 1.2 }}>{selected.name}</div>
                    <div style={{ color: colors.muted, fontSize: 13 }}>{selected.label ? `${selected.label} · ` : ""}{selected.tagline}</div>
                  </div>
                </Flex>

                <Form.Item name="product" label="Pen" style={{ marginBottom: 16 }}>
                  <Segmented block options={PRODUCT_IDS.map((id) => ({ value: id, label: PRODUCTS[id].name }))} />
                </Form.Item>
                <Form.Item name="strength" label="Strength" style={{ marginBottom: 16 }}>
                  <Segmented
                    block
                    options={STRENGTHS.map((value) => ({ value, label: `${strengthLabel(value)} · ${formatUsd(priceOf(product, value).sale)}` }))}
                  />
                </Form.Item>
                <Form.Item name="quantity" label="Quantity" style={{ marginBottom: 20 }}>
                  <InputNumber min={1} max={MAX_QUANTITY} precision={0} style={{ width: 120 }} />
                </Form.Item>

                <Form.Item label="Discount code" style={{ marginBottom: 6 }}>
                  <Space.Compact block>
                    <Input
                      value={inputValue}
                      onChange={(event) => {
                        setCodeInput(event.target.value)
                        setManualCode(null)
                      }}
                      onPressEnter={(event) => {
                        event.preventDefault()
                        void applyCode(inputValue)
                      }}
                      placeholder="Your code"
                      maxLength={LIMITS.promoCode}
                      style={{ textTransform: "uppercase" }}
                    />
                    <Button onClick={() => applyCode(inputValue)} loading={checkingCode} disabled={!inputValue.trim() || !!appliedCode}>
                      {appliedCode ? "Applied" : "Apply"}
                    </Button>
                  </Space.Compact>
                </Form.Item>
                {!appliedCode && (
                  <Typography.Link onClick={openPromo} style={{ fontSize: 13, color: colors.sale, fontWeight: 600 }}>
                    <GiftFilled /> Get an extra {OFFER.subscriberPercent}% code
                  </Typography.Link>
                )}

                <Divider style={{ margin: "16px 0" }} />
                <Flex vertical gap={6} style={{ fontSize: 14 }}>
                  <Flex justify="space-between" style={{ color: colors.muted }}>
                    <span>
                      {safeQuantity} × {formatUsd(amounts.regular)} regular price
                    </span>
                    <span style={{ textDecoration: amounts.saved ? "line-through" : undefined }}>{formatUsd(amounts.regularTotal)}</span>
                  </Flex>
                  {OFFER.salePercent > 0 && (
                    <Flex justify="space-between" style={{ color: colors.sale, fontWeight: 600 }}>
                      <span>
                        {OFFER.saleLabel} −{OFFER.salePercent}%
                      </span>
                      <span>−{formatUsd(amounts.regularTotal - amounts.subtotal)}</span>
                    </Flex>
                  )}
                  {appliedCode && (
                    <Flex justify="space-between" style={{ color: colors.success, fontWeight: 600 }}>
                      <span>
                        Code {appliedCode} −{OFFER.subscriberPercent}%
                      </span>
                      <span>−{formatUsd(amounts.codeDiscount)}</span>
                    </Flex>
                  )}
                </Flex>
                <Flex justify="space-between" align="baseline" style={{ marginTop: 10 }}>
                  <span style={{ fontWeight: 600 }}>Total</span>
                  <span style={{ fontFamily: fonts.display, fontSize: 36, color: colors.navy, fontWeight: 600 }}>{formatUsd(total)}</span>
                </Flex>
                {amounts.saved > 0 && (
                  <Flex justify="flex-end">
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        padding: "3px 12px",
                        borderRadius: 999,
                        color: colors.saleDeep,
                        background: colors.goldWash,
                        border: `1px solid ${colors.goldLight}`,
                      }}
                    >
                      You save {formatUsd(amounts.saved)}
                    </span>
                  </Flex>
                )}

                <Flex vertical gap={8} style={{ marginTop: 20, fontSize: 13, color: colors.navyInk, display: screens.md ? undefined : "none" }}>
                  <span>
                    <SafetyCertificateOutlined style={{ color: colors.blue, marginRight: 8 }} />
                    ≥99% purity, COA with every lot
                  </span>
                  <span>
                    <ThunderboltOutlined style={{ color: colors.blue, marginRight: 8 }} />
                    Ships within 24 h of payment
                  </span>
                  <span>
                    <MailOutlined style={{ color: colors.blue, marginRight: 8 }} />
                    Payment details by email, nothing to pay now
                  </span>
                </Flex>
              </div>
            </Col>

            {/* Right: who and where */}
            <Col xs={24} md={14}>
              <div style={{ padding: "28px clamp(20px, 3vw, 32px) 24px" }}>
                <Typography.Title level={3} style={{ fontFamily: fonts.display, fontWeight: 400, color: colors.navy, margin: "0 0 4px" }}>
                  Where should we send it?
                </Typography.Title>
                <Typography.Paragraph style={{ color: colors.muted, marginBottom: 20 }}>
                  No account, no cart. One short form and you&apos;re done.
                </Typography.Paragraph>

                <Form.Item name="name" label="Full name" rules={[{ required: true, min: 2, message: "Enter your full name." }]}>
                  <Input autoComplete="name" maxLength={LIMITS.name} />
                </Form.Item>
                <Row gutter={12}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="email" label="Email" rules={[{ required: true, pattern: EMAIL_PATTERN, message: "Enter a valid email." }]}>
                      <Input type="email" autoComplete="email" inputMode="email" maxLength={LIMITS.email} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="phone"
                      label="Phone (with country code)"
                      rules={[{ required: true, pattern: PHONE_PATTERN, message: "Enter a phone number, e.g. +1 555 123 4567." }]}
                    >
                      <Input type="tel" autoComplete="tel" inputMode="tel" placeholder="+1 555 123 4567" maxLength={LIMITS.phone} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="contactApp" label="Best way to reach you">
                  <Radio.Group optionType="button" buttonStyle="solid" options={CONTACT_APPS.map((app) => ({ value: app, label: CONTACT_APP_LABELS[app] }))} />
                </Form.Item>
                {contactApp !== "email" && (
                  <Form.Item name="contactHandle" style={{ marginTop: -8 }}>
                    <Input placeholder={HANDLE_HINT[contactApp]} maxLength={LIMITS.contactHandle} />
                  </Form.Item>
                )}

                <Form.Item name="country" label="Country" rules={[{ required: true, message: "Choose a country." }]}>
                  <Select
                    showSearch={{ optionFilterProp: "label" }}
                    options={COUNTRY_OPTIONS}
                    placeholder="Choose a country"
                    autoComplete="country"
                  />
                </Form.Item>
                <Form.Item name="address" label="Street address" rules={[{ required: true, min: 4, message: "Enter the street address." }]}>
                  <Input autoComplete="street-address" maxLength={LIMITS.address} />
                </Form.Item>
                <Row gutter={12}>
                  <Col xs={14}>
                    <Form.Item name="city" label="City" rules={[{ required: true, min: 2, message: "Enter the city." }]}>
                      <Input autoComplete="address-level2" maxLength={LIMITS.city} />
                    </Form.Item>
                  </Col>
                  <Col xs={10}>
                    <Form.Item name="postalCode" label="Postal code" rules={[{ required: true, message: "Enter the postal code." }]}>
                      <Input autoComplete="postal-code" maxLength={LIMITS.postalCode} />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="note" label="Note (optional)">
                  <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} maxLength={LIMITS.note} />
                </Form.Item>

                {/* Honeypot: hidden from people, filled by bots */}
                <Form.Item name="website" hidden>
                  <Input tabIndex={-1} autoComplete="off" />
                </Form.Item>

                <Form.Item
                  name="researchUse"
                  valuePropName="checked"
                  rules={[{ validator: (_, value) => (value ? Promise.resolve() : Promise.reject(new Error("Please confirm research use."))) }]}
                >
                  <Checkbox>I confirm these products are for research use only.</Checkbox>
                </Form.Item>

                <Button type="primary" htmlType="submit" size="large" block loading={submitting} icon={<LockOutlined />} style={{ height: 56, fontSize: 17 }}>
                  Place order · {formatUsd(total)}
                </Button>
                <Typography.Paragraph style={{ color: colors.muted, fontSize: 12, textAlign: "center", margin: "12px 0 0" }}>
                  You&apos;ll get a confirmation email with payment details right away. Questions? Write to {SITE.email}.
                </Typography.Paragraph>
              </div>
            </Col>
          </Row>
        </Form>
      )}
    </Modal>
  )
}
