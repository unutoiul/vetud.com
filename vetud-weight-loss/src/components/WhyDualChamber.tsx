"use client"

import { ExperimentOutlined, PlayCircleFilled, ReloadOutlined, SafetyCertificateOutlined, ShoppingOutlined } from "@ant-design/icons"
import { Button, Col, Flex, Image as AntImage, Row, Typography } from "antd"
import { colors, fonts, shadows } from "@/theme/tokens"
import { useOrder } from "./OrderProvider"
import { Section, SectionHeading } from "./ui"

const BENEFITS = [
  {
    icon: <SafetyCertificateOutlined />,
    title: "Sealed until the moment you mix",
    text: "The freeze-dried peptide sits in its own chamber, kept away from the liquid by a stopper. Nothing degrades on the shelf, nothing is mixed before you want it.",
  },
  {
    icon: <ExperimentOutlined />,
    title: "BAC water already in the cartridge",
    text: "The second chamber holds the bacteriostatic water. No extra vials to buy, no measuring, no transfers. Everything you need ships in one box.",
  },
  {
    icon: <ReloadOutlined />,
    title: "Precision counter, reusable pen body",
    text: "The cartridge clicks into the VETUD pen with its counter window. Keep the pen, swap the cartridge. Clean, exact, and built to be used again.",
  },
]

export default function WhyDualChamber() {
  const { openOrder } = useOrder()
  return (
    <Section id="dual-chamber" background={colors.iceWash}>
      <SectionHeading
        eyebrow="The VETUD dual-chamber pen"
        title="Built like a pharmacy pen."
        subtitle="Two chambers, one cartridge: freeze-dried peptide on top, BAC water below, kept apart until you combine them. Then it locks into the reusable VETUD pen."
      />
      <Row gutter={[{ xs: 16, md: 48 }, 40]} align="middle">
        <Col xs={24} md={12}>
          <div style={{ borderRadius: 24, overflow: "hidden", boxShadow: shadows.lifted, border: `1px solid ${colors.line}`, background: colors.white }}>
            <AntImage
              src="/images/pen-diagram.webp"
              alt="The VETUD cartridge holds freeze-dried peptide and BAC water and sits inside the pen's cartridge holder"
              width="100%"
              style={{ display: "block", aspectRatio: "1 / 1", objectFit: "cover" }}
              preview={{ mask: "Enlarge" }}
            />
          </div>
        </Col>
        <Col xs={24} md={12}>
          <Flex vertical gap={28}>
            {BENEFITS.map((benefit) => (
              <Flex key={benefit.title} gap={18} align="flex-start">
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
                    background: `linear-gradient(135deg, ${colors.blue}, ${colors.navy})`,
                  }}
                >
                  {benefit.icon}
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
                Get my pen
              </Button>
            </div>
          </Flex>
        </Col>
      </Row>

      <div style={{ marginTop: "clamp(48px, 7vw, 88px)" }}>
        <Flex align="center" gap={10} justify="center" style={{ marginBottom: 20, color: colors.navy }}>
          <PlayCircleFilled style={{ color: colors.blue, fontSize: 20 }} />
          <span style={{ fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase" }}>Watch it work · 40 seconds</span>
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
