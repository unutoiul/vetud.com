"use client"

import { CarOutlined, FormOutlined, MailOutlined, ShoppingOutlined } from "@ant-design/icons"
import { Button, Col, Flex, Row, Typography } from "antd"
import { colors, fonts, shadows } from "@/theme/tokens"
import { useMessages } from "./MessagesProvider"
import { useOrder } from "./OrderProvider"
import { Section, SectionHeading } from "./ui"

/** One icon per step, in the order of howToOrder.steps in the messages. */
const STEP_ICONS = [
  <ShoppingOutlined key="choose" />,
  <FormOutlined key="form" />,
  <MailOutlined key="email" />,
  <CarOutlined key="ship" />,
]

export default function HowToOrder() {
  const { openOrder } = useOrder()
  const t = useMessages().howToOrder
  return (
    <Section id="how" background={colors.paper} joined>
      <SectionHeading eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />
      <Row gutter={[24, 24]}>
        {t.steps.map((step, index) => (
          <Col key={index} xs={24} sm={12} lg={6}>
            <div
              style={{
                height: "100%",
                boxSizing: "border-box",
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
                style={{
                  position: "absolute",
                  top: 18,
                  right: 22,
                  fontFamily: fonts.display,
                  fontSize: 44,
                  fontWeight: 300,
                  color: colors.aqua,
                  lineHeight: 1,
                }}
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
                  background: colors.aquaLight,
                  border: `1px solid ${colors.aqua}`,
                }}
              >
                {STEP_ICONS[index]}
              </span>
              <Typography.Title
                level={4}
                style={{
                  fontFamily: fonts.display,
                  fontWeight: 500,
                  fontSize: 21,
                  color: colors.navy,
                  margin: "20px 0 8px",
                }}
              >
                {step.title}
              </Typography.Title>
              <Typography.Paragraph style={{ color: colors.muted, fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                {step.text}
              </Typography.Paragraph>
            </div>
          </Col>
        ))}
      </Row>
      <Flex justify="center" style={{ marginTop: 48 }}>
        <Button
          type="primary"
          size="large"
          icon={<ShoppingOutlined />}
          onClick={() => openOrder()}
          style={{ height: 56, padding: "0 40px", fontSize: 17 }}
        >
          {t.cta}
        </Button>
      </Flex>
    </Section>
  )
}
