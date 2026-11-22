"use client"

import { CarOutlined, FormOutlined, MailOutlined, ShoppingOutlined } from "@ant-design/icons"
import { Button, Col, Flex, Row, Typography } from "antd"
import { colors, fonts, shadows } from "@/theme/tokens"
import { useOrder } from "./OrderProvider"
import { Section, SectionHeading } from "./ui"

const STEPS = [
  { icon: <ShoppingOutlined />, title: "Choose your pen", text: "Tirzepatide or Retatrutide, 20 mg or 40 mg. Press Buy now." },
  { icon: <FormOutlined />, title: "Fill one short form", text: "Name, email, phone and address. No account, no cart, under a minute." },
  { icon: <MailOutlined />, title: "Get the email", text: "Your confirmation arrives right away, with the payment details and your order number." },
  { icon: <CarOutlined />, title: "We ship in 24 h", text: "Once payment arrives your pens ship, discreetly packed, with tracking." },
]

export default function HowToOrder() {
  const { openOrder } = useOrder()
  return (
    <Section id="how" background={colors.paper}>
      <SectionHeading eyebrow="How to order" title="From click to doorstep in four steps." subtitle="One way to order, built to be fast. You always know where your order stands." />
      <Row gutter={[24, 24]}>
        {STEPS.map((step, index) => (
          <Col key={step.title} xs={24} sm={12} lg={6}>
            <div
              style={{
                height: "100%",
                background: colors.white,
                border: `1px solid ${colors.line}`,
                borderRadius: 20,
                padding: 28,
                boxShadow: shadows.card,
                position: "relative",
              }}
            >
              <span
                aria-hidden
                style={{ position: "absolute", top: 18, right: 22, fontFamily: fonts.display, fontSize: 44, fontWeight: 300, color: colors.ice, lineHeight: 1 }}
              >
                {index + 1}
              </span>
              <span
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 20,
                  color: colors.navy,
                  background: colors.iceLight,
                  border: `1px solid ${colors.ice}`,
                }}
              >
                {step.icon}
              </span>
              <Typography.Title level={4} style={{ fontFamily: fonts.display, fontWeight: 500, fontSize: 21, color: colors.navy, margin: "20px 0 8px" }}>
                {step.title}
              </Typography.Title>
              <Typography.Paragraph style={{ color: colors.muted, fontSize: 15, lineHeight: 1.6, margin: 0 }}>{step.text}</Typography.Paragraph>
            </div>
          </Col>
        ))}
      </Row>
      <Flex justify="center" style={{ marginTop: 48 }}>
        <Button type="primary" size="large" icon={<ShoppingOutlined />} onClick={() => openOrder()} style={{ height: 56, padding: "0 40px", fontSize: 17 }}>
          Start my order
        </Button>
      </Flex>
    </Section>
  )
}
