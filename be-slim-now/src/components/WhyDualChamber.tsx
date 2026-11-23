"use client"

import { ExperimentOutlined, PlayCircleFilled, ReloadOutlined, SafetyCertificateOutlined, ShoppingOutlined } from "@ant-design/icons"
import { Button, Col, Flex, Image as AntImage, Row, Typography } from "antd"
import { colors, fonts, shadows } from "@/theme/tokens"
import { useMessages } from "./MessagesProvider"
import { useOrder } from "./OrderProvider"
import { Section, SectionHeading } from "./ui"

/** One icon per benefit, in the order of dualChamber.benefits in the messages. */
const BENEFIT_ICONS = [<SafetyCertificateOutlined key="sealed" />, <ExperimentOutlined key="water" />, <ReloadOutlined key="reusable" />]

export default function WhyDualChamber() {
  const { openOrder } = useOrder()
  const t = useMessages().dualChamber
  return (
    <Section id="dual-chamber" background={colors.aquaWash}>
      <SectionHeading
        eyebrow={t.eyebrow}
        title={t.title}
        subtitle={t.subtitle}
      />
      <Row gutter={[{ xs: 16, md: 48 }, 40]} align="middle">
        <Col xs={24} md={12}>
          <div style={{ borderRadius: 24, overflow: "hidden", boxShadow: shadows.lifted, border: `1px solid ${colors.line}`, background: colors.white }}>
            <AntImage
              src="/images/pen-diagram.webp"
              alt={t.diagramAlt}
              width="100%"
              styles={{ root: { display: "block" } }}
              style={{ display: "block", aspectRatio: "1 / 1", objectFit: "cover" }}
              preview={{ mask: t.enlarge }}
            />
          </div>
        </Col>
        <Col xs={24} md={12}>
          <Flex vertical gap={28}>
            {t.benefits.map((benefit, index) => (
              <Flex key={index} gap={18} align="flex-start">
                <span
                  style={{
                    flex: "none",
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 22,
                    color: colors.white,
                    background: `linear-gradient(135deg, ${colors.teal}, ${colors.navy})`,
                  }}
                >
                  {BENEFIT_ICONS[index]}
                </span>
                <div>
                  <Typography.Title level={4} style={{ fontFamily: fonts.display, fontWeight: 500, color: colors.navy, margin: "2px 0 6px", fontSize: 22 }}>
                    {benefit.title}
                  </Typography.Title>
                  <Typography.Paragraph style={{ color: colors.muted, fontSize: 15, lineHeight: 1.65, margin: 0 }}>{benefit.text}</Typography.Paragraph>
                </div>
              </Flex>
            ))}
            <div>
              <Button type="primary" size="large" icon={<ShoppingOutlined />} onClick={() => openOrder()} style={{ height: 54, padding: "0 28px", fontSize: 16 }}>
                {t.cta}
              </Button>
            </div>
          </Flex>
        </Col>
      </Row>

      <div style={{ marginTop: "clamp(48px, 7vw, 88px)" }}>
        <Flex align="center" gap={10} justify="center" style={{ marginBottom: 20, color: colors.navy }}>
          <PlayCircleFilled style={{ color: colors.teal, fontSize: 20 }} />
          <span style={{ fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase" }}>{t.video}</span>
        </Flex>
        <div style={{ maxWidth: 960, margin: "0 auto", borderRadius: 24, overflow: "hidden", boxShadow: shadows.lifted, border: `1px solid ${colors.line}`, background: colors.navyDeep }}>
          <video
            controls
            muted
            playsInline
            preload="none"
            poster="/images/explainer-poster.webp"
            style={{ display: "block", width: "100%", aspectRatio: "16 / 9", background: colors.navyDeep }}
          >
            <source src="/videos/dual-chamber-explainer.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    </Section>
  )
}
