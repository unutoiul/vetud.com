"use client"

import { CheckCircleFilled, GiftFilled, LockOutlined, MailOutlined, SafetyCertificateOutlined, ThunderboltOutlined } from "@ant-design/icons"
import { App, Button, Col, Divider, Flex, Form, Grid, Input, InputNumber, Modal, Result, Row, Segmented, Select, Space, Typography } from "antd"
import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import { isMarket, type CountryCode } from "@/config/markets"
import { MAX_QUANTITY, OFFER, PRODUCT_IDS, PRODUCTS, SITE, STRENGTHS, contactLinks, strengthLabel, type ProductId, type Strength } from "@/config/site"
import { format, rich } from "@/i18n/format"
import { countryName, internationalPhone } from "@/lib/countries"
import { EMAIL_PATTERN, LIMITS, PHONE_PATTERN, orderTotal, type ContactApp } from "@/lib/order"
import { currencyOf, formatPrice, priceOf, pricingCountry } from "@/lib/pricing"
import { colors, fonts } from "@/theme/tokens"
import { useCountry } from "./CountryProvider"
import { CountryFlag, filterCountry, renderCountryOption, useCountryGroups } from "./CountrySelect"
import { CONTACT_COLORS, ContactIcon } from "./icons/ContactIcon"
import { useMessages } from "./MessagesProvider"
import { useOrder } from "./OrderProvider"
import PhoneField from "./PhoneField"

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
  website?: string
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
  const m = useMessages()
  const t = m.order
  const { message } = App.useApp()
  const screens = Grid.useBreakpoint()
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<{ orderNumber: string; email: string; total: number; country: CountryCode } | null>(null)
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
  const safeQuantity = Math.min(Math.max(Number(quantity) || 1, 1), MAX_QUANTITY)
  // Prices follow the country the order ships to (its own prices when it's in the header's country
  // picker, US prices anywhere else), exactly as the server will work them out.
  const { country: visitorCountry, setCountry } = useCountry()
  // Same flags and names as the header picker, plus every other country we ship to (US prices).
  const countryGroups = useCountryGroups(true)
  const shipTo: string = Form.useWatch("country", form) ?? visitorCountry
  const priceCountry = pricingCountry(shipTo)
  const money = (amount: number) => formatPrice(amount, priceCountry)
  const amounts = orderTotal(product, strength, safeQuantity, !!appliedCode, priceCountry)
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
          if (!quiet) message.success(format(t.codeApplied, { code, percent: OFFER.subscriberPercent }))
        } else if (!quiet) {
          message.error(t.codeInvalid)
        }
      } catch {
        if (!quiet) message.error(t.codeCheckFailed)
      } finally {
        setCheckingCode(false)
      }
    },
    [message, t.codeApplied, t.codeInvalid, t.codeCheckFailed],
  )


  // Each time the form opens, start from the pen the visitor clicked.
  useEffect(() => {
    if (!open) return
    form.setFieldsValue({ product: initial.product, strength: initial.strength })
  }, [open, initial.product, initial.strength, form])

  // Ship to the country chosen in the header, unless the visitor already typed a country outside the picker.
  useEffect(() => {
    if (!open) return
    const current = form.getFieldValue("country") as string | undefined
    if (!current || isMarket(current)) form.setFieldsValue({ country: visitorCountry })
  }, [open, visitorCountry, form])

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
        body: JSON.stringify({ ...all, phone: internationalPhone(all.phone ?? ""), quantity: submittedQuantity, promoCode: appliedCode ?? "" }),
      })
      const data = (await res.json().catch(() => ({}))) as { orderNumber?: string; total?: number; error?: string; fields?: Record<string, string> }
      if (!res.ok || !data.orderNumber) {
        if (data.fields) {
          form.setFields(Object.entries(data.fields).map(([name, error]) => ({ name: name as keyof FormValues, errors: [error] })))
        }
        message.error(data.error || t.genericError)
        return
      }
      setDone({
        orderNumber: data.orderNumber,
        email: all.email,
        total: data.total ?? orderTotal(all.product, all.strength, submittedQuantity, !!appliedCode, all.country).total,
        country: pricingCountry(all.country),
      })
      form.resetFields(["note", "quantity"])
    } catch {
      message.error(t.noConnection)
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
            title={<span style={{ fontFamily: fonts.display, fontSize: 30, color: colors.navy }}>{format(t.doneTitle, { orderNumber: done.orderNumber })}</span>}
            subTitle={
              <span style={{ fontSize: 16, lineHeight: 1.6 }}>
                {rich(t.doneText, { email: done.email, total: formatPrice(done.total, done.country) }, { b: (text) => <strong>{text}</strong> })}
                <br />
                {t.doneSpam}
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
                    {m.contact.apps[link.key]}
                  </Button>
                ))}
                <Button size="large" type="primary" onClick={onClose}>
                  {t.doneButton}
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
          initialValues={{ product: initial.product, strength: initial.strength, quantity: 1, contactApp: "whatsapp", country: visitorCountry }}
          scrollToFirstError
        >
          <Row>
            {/* Left: the pen, the strength and the total */}
            <Col xs={24} md={10} style={{ background: colors.aquaWash, borderRight: screens.md ? `1px solid ${colors.line}` : undefined }}>
              <div style={{ padding: "28px clamp(20px, 3vw, 32px)" }}>
                <div style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: colors.tealDeep }}>
                  {t.yourOrder}
                </div>
                <Flex align="center" gap={16} style={{ margin: "16px 0 20px" }}>
                  <div style={{ width: 88, height: 88, position: "relative", flex: "none", borderRadius: 14, background: colors.white, border: `1px solid ${colors.line}` }}>
                    <Image src={selected.image} alt={m.products[product].fullName} fill sizes="88px" style={{ objectFit: "contain", padding: 4 }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: fonts.display, fontSize: 22, color: colors.navy, lineHeight: 1.2 }}>{selected.name}</div>
                    <div style={{ color: colors.muted, fontSize: 13 }}>{selected.label ? `${selected.label} · ` : ""}{m.products[product].tagline}</div>
                  </div>
                </Flex>

                {/* The shipping country comes first: it sets the currency of every price below. */}
                <Form.Item
                  name="country"
                  label={
                    <span>
                      {t.shipTo} <span style={{ color: colors.muted, fontWeight: 400 }}>{format(t.pricesIn, { currency: currencyOf(priceCountry) })}</span>
                    </span>
                  }
                  rules={[{ required: true, message: t.chooseCountryError }]}
                  style={{ marginBottom: 16 }}
                >
                  <Select<string>
                    showSearch={{ filterOption: filterCountry }}
                    options={countryGroups}
                    optionRender={renderCountryOption}
                    labelRender={({ value }) =>
                      typeof value === "string" && value ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 10, height: "100%" }}>
                          <CountryFlag code={value} />
                          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{countryName(value)}</span>
                        </span>
                      ) : null
                    }
                    placeholder={t.chooseCountry}
                    autoComplete="country"
                    listHeight={320}
                    // A country from the header picker becomes the visitor's country for the whole page too.
                    onChange={(code) => {
                      if (isMarket(code)) setCountry(code)
                    }}
                  />
                </Form.Item>

                <Form.Item name="product" label={t.pen} style={{ marginBottom: 16 }}>
                  <Segmented block options={PRODUCT_IDS.map((id) => ({ value: id, label: PRODUCTS[id].name }))} />
                </Form.Item>
                <Form.Item name="strength" label={t.strength} style={{ marginBottom: 16 }}>
                  <Segmented
                    block
                    options={STRENGTHS.map((value) => ({ value, label: `${strengthLabel(value)} · ${money(priceOf(product, value, priceCountry).sale)}` }))}
                  />
                </Form.Item>
                <Form.Item name="quantity" label={t.quantity} style={{ marginBottom: 20 }}>
                  <InputNumber min={1} max={MAX_QUANTITY} precision={0} style={{ width: 120 }} />
                </Form.Item>

                <Form.Item label={t.discountCode} style={{ marginBottom: 6 }}>
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
                      placeholder={t.codePlaceholder}
                      maxLength={LIMITS.promoCode}
                      style={{ textTransform: "uppercase" }}
                    />
                    <Button onClick={() => applyCode(inputValue)} loading={checkingCode} disabled={!inputValue.trim() || !!appliedCode}>
                      {appliedCode ? t.applied : t.apply}
                    </Button>
                  </Space.Compact>
                </Form.Item>
                {!appliedCode && (
                  <Typography.Link onClick={openPromo} style={{ fontSize: 13, color: colors.sale, fontWeight: 600 }}>
                    <GiftFilled /> {format(t.getCode, { percent: OFFER.subscriberPercent })}
                  </Typography.Link>
                )}

                <Divider style={{ margin: "16px 0" }} />
                <Flex vertical gap={6} style={{ fontSize: 14 }}>
                  <Flex justify="space-between" style={{ color: colors.muted }}>
                    <span>
                      {format(t.regularLine, { quantity: safeQuantity, price: money(amounts.regular) })}
                    </span>
                    <span style={{ textDecoration: amounts.saved ? "line-through" : undefined }}>{money(amounts.regularTotal)}</span>
                  </Flex>
                  {OFFER.salePercent > 0 && (
                    <Flex justify="space-between" style={{ color: colors.sale, fontWeight: 600 }}>
                      <span>
                        {format(t.saleLine, { saleLabel: m.offer.saleLabel, percent: OFFER.salePercent })}
                      </span>
                      <span>−{money(amounts.regularTotal - amounts.subtotal)}</span>
                    </Flex>
                  )}
                  {appliedCode && (
                    <Flex justify="space-between" style={{ color: colors.success, fontWeight: 600 }}>
                      <span>
                        {format(t.codeLine, { code: appliedCode, percent: OFFER.subscriberPercent })}
                      </span>
                      <span>−{money(amounts.codeDiscount)}</span>
                    </Flex>
                  )}
                </Flex>
                <Flex justify="space-between" align="baseline" style={{ marginTop: 10 }}>
                  <span style={{ fontWeight: 600 }}>{t.total}</span>
                  <span style={{ fontFamily: fonts.display, fontSize: 36, color: colors.navy, fontWeight: 600 }}>{money(total)}</span>
                </Flex>
                <Flex justify="flex-end">
                  {amounts.saved > 0 && (
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        padding: "3px 12px",
                        borderRadius: 999,
                        color: colors.saleDeep,
                        background: colors.limeWash,
                        border: `1px solid ${colors.limeLight}`,
                      }}
                    >
                      {format(t.youSave, { price: money(amounts.saved) })}
                    </span>
                  )}
                </Flex>

                <Flex vertical gap={8} style={{ marginTop: 20, fontSize: 13, color: colors.navyInk, display: screens.md ? undefined : "none" }}>
                  {[SafetyCertificateOutlined, ThunderboltOutlined, MailOutlined].map((Icon, index) => (
                    <span key={index}>
                      <Icon style={{ color: colors.teal, marginRight: 8 }} />
                      {t.perks[index]}
                    </span>
                  ))}
                </Flex>
              </div>
            </Col>

            {/* Right: who and where */}
            <Col xs={24} md={14}>
              <div style={{ padding: "28px clamp(20px, 3vw, 32px) 24px" }}>
                <Typography.Title level={3} style={{ fontFamily: fonts.display, fontWeight: 400, color: colors.navy, margin: "0 0 4px" }}>
                  {t.title}
                </Typography.Title>
                <Typography.Paragraph style={{ color: colors.muted, marginBottom: 20 }}>
                  {t.subtitle}
                </Typography.Paragraph>

                <Form.Item name="name" label={t.fullName} rules={[{ required: true, min: 2, message: t.fullNameError }]}>
                  <Input autoComplete="name" maxLength={LIMITS.name} />
                </Form.Item>
                <Row gutter={12}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="email" label={t.email} rules={[{ required: true, pattern: EMAIL_PATTERN, message: t.emailError }]}>
                      <Input type="email" autoComplete="email" inputMode="email" maxLength={LIMITS.email} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="phone"
                      label={t.phone}
                      rules={[{ required: true, pattern: PHONE_PATTERN, message: t.phoneError }]}
                    >
                      <PhoneField country={shipTo} placeholder={t.phonePlaceholder} codeLabel={t.phoneCode} maxLength={LIMITS.phone} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="address" label={t.address} rules={[{ required: true, min: 4, message: t.addressError }]}>
                  <Input autoComplete="street-address" maxLength={LIMITS.address} />
                </Form.Item>
                <Row gutter={12}>
                  <Col xs={14}>
                    <Form.Item name="city" label={t.city} rules={[{ required: true, min: 2, message: t.cityError }]}>
                      <Input autoComplete="address-level2" maxLength={LIMITS.city} />
                    </Form.Item>
                  </Col>
                  <Col xs={10}>
                    <Form.Item name="postalCode" label={t.postalCode} rules={[{ required: true, message: t.postalCodeError }]}>
                      <Input autoComplete="postal-code" maxLength={LIMITS.postalCode} />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="note" label={t.note}>
                  <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} maxLength={LIMITS.note} />
                </Form.Item>

                {/* Honeypot: hidden from people, filled by bots */}
                <Form.Item name="website" hidden>
                  <Input tabIndex={-1} autoComplete="off" />
                </Form.Item>

                <Button type="primary" htmlType="submit" size="large" block loading={submitting} icon={<LockOutlined />} style={{ height: 56, fontSize: 17 }}>
                  {format(t.placeOrder, { price: money(total) })}
                </Button>
                <Typography.Paragraph style={{ color: colors.muted, fontSize: 12, textAlign: "center", margin: "12px 0 0" }}>
                  {format(t.confirmationNote, { email: SITE.email })}
                </Typography.Paragraph>
              </div>
            </Col>
          </Row>
        </Form>
      )}
    </Modal>
  )
}
