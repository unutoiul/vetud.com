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
      {/* The diagram (square) and the video (16:9) side by side, sized 9:16 so they stand the same
          height; stacked on phones. The three benefits sit underneath. */}
      <Row gutter={[{ xs: 16, md: 24 }, 24]} align="top">
        <Col xs={24} md={{ flex: "9 1 0%" }} style={{ minWidth: 0 }}>
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
        <Col xs={24} md={{ flex: "16 1 0%" }} style={{ minWidth: 0 }}>
          <div style={{ borderRadius: 24, overflow: "hidden", boxShadow: shadows.lifted, border: `1px solid ${colors.line}`, background: colors.navyDeep }}>
            <video
              controls
              muted
              playsInline
              preload="none"
              poster="/images/explainer-poster.webp"
              aria-label={t.video}
              style={{ display: "block", width: "100%", aspectRatio: "16 / 9", background: colors.navyDeep }}
            >
              <source src="/videos/dual-chamber-explainer.mp4" type="video/mp4" />
            </video>
          </div>
          <Flex align="center" gap={10} style={{ marginTop: 14, color: colors.navy }}>
            <PlayCircleFilled style={{ color: colors.teal, fontSize: 18 }} />
            <span style={{ fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase" }}>{t.video}</span>
          </Flex>
        </Col>
      </Row>

      <Row gutter={[{ xs: 16, lg: 40 }, 28]} style={{ marginTop: "clamp(36px, 5vw, 56px)" }}>
        {t.benefits.map((benefit, index) => (
          <Col key={index} xs={24} lg={8}>
            <Flex gap={18} align="flex-start">
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
              <div style={{ minWidth: 0 }}>
                <Typography.Title level={4} style={{ fontFamily: fonts.display, fontWeight: 500, color: colors.navy, margin: "2px 0 6px", fontSize: 22 }}>
                  {benefit.title}
                </Typography.Title>
                <Typography.Paragraph style={{ color: colors.muted, fontSize: 15, lineHeight: 1.65, margin: 0 }}>{benefit.text}</Typography.Paragraph>
              </div>
            </Flex>
          </Col>
        ))}
      </Row>
      <Flex justify="center" style={{ marginTop: 40 }}>
        <Button type="primary" size="large" icon={<ShoppingOutlined />} onClick={() => openOrder()} style={{ height: 54, padding: "0 28px", fontSize: 16 }}>
          {t.cta}
        </Button>
      </Flex>
    </Section>
  )
}
