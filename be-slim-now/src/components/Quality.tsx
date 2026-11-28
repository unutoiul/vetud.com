"use client"

import { Col, Row, Typography } from "antd"
import { colors, fonts, gradients } from "@/theme/tokens"
import Image from "next/image"
import { PRODUCTS } from "@/config/site"
import { useMessages } from "./MessagesProvider"
import { Container, SECTION_PADDING, SectionHeading } from "./ui"

export default function Quality() {
  const t = useMessages().quality
  return (
    <section
      id="quality"
      style={{ position: "relative", overflow: "hidden", background: gradients.night, padding: SECTION_PADDING }}
    >
      <div aria-hidden style={{ position: "absolute", inset: 0, opacity: 0.7 }}>
        <Image
          src={PRODUCTS.retatrutide.art}
          alt=""
          fill
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
      </div>
      <div
        aria-hidden
        style={{ position: "absolute", left: 0, right: 0, top: 0, height: "62%", background: gradients.nightScrim }}
      />
      <Container style={{ position: "relative" }}>
        <SectionHeading inverse eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />
        <Row gutter={[1, 1]} style={{ borderRadius: 20, overflow: "hidden", border: `1px solid ${colors.onNavyLine}` }}>
          {t.stats.map((stat, index) => (
            <Col key={index} xs={24} sm={12} lg={6}>
              <div
                style={{
                  height: "100%",
                  boxSizing: "border-box",
                  padding: "36px 28px",
                  outline: `1px solid ${colors.onNavyLine}`,
                  background: colors.nightGlass,
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
              >
                <div
                  style={{
                    fontFamily: fonts.display,
                    fontSize: "clamp(44px, 5vw, 56px)",
                    fontWeight: 300,
                    color: colors.onNavy,
                    lineHeight: 1,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 12,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: colors.aqua,
                    margin: "14px 0 8px",
                  }}
                >
                  {stat.label}
                </div>
                <Typography.Paragraph style={{ color: colors.onNavyMuted, fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                  {stat.text}
                </Typography.Paragraph>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  )
}
