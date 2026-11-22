"use client"

import { Col, Row, Typography } from "antd"
import { colors, fonts, gradients } from "@/theme/tokens"
import Ribbons from "./Ribbons"
import { Container, SectionHeading } from "./ui"

const STATS = [
  { value: "≥99%", label: "Purity", text: "HPLC-verified on every lot" },
  { value: "COA", label: "Every lot", text: "Certificate of analysis on request, matched to your lot number" },
  { value: "24 h", label: "Dispatch", text: "Ships within one business day of payment" },
  { value: "12", label: "Needles in every box", text: "With the pen and an instruction booklet, ready to go" },
]

export default function Quality() {
  return (
    <section id="quality" style={{ position: "relative", overflow: "hidden", background: gradients.night, padding: "clamp(64px, 9vw, 112px) 0" }}>
      <div aria-hidden style={{ position: "absolute", inset: 0, opacity: 0.45 }}>
        <Ribbons />
      </div>
      <div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: 0, height: "62%", background: gradients.nightScrim }} />
      <Container style={{ position: "relative" }}>
        <SectionHeading
          inverse
          eyebrow="Quality you can check"
          title="Lab results, not promises."
          subtitle="Every VETUD lot is HPLC-tested and documented before it ships. Ask us for the COA of the lot you receive, any time, and we send it."
        />
        <Row gutter={[1, 1]} style={{ borderRadius: 20, overflow: "hidden", border: `1px solid ${colors.onNavyLine}` }}>
          {STATS.map((stat) => (
            <Col key={stat.label} xs={24} sm={12} lg={6}>
              <div style={{ height: "100%", padding: "36px 28px", outline: `1px solid ${colors.onNavyLine}`, background: colors.nightGlass, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                <div style={{ fontFamily: fonts.display, fontSize: "clamp(44px, 5vw, 56px)", fontWeight: 300, color: colors.onNavy, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontFamily: fonts.mono, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: colors.ice, margin: "14px 0 8px" }}>
                  {stat.label}
                </div>
                <Typography.Paragraph style={{ color: colors.onNavyMuted, fontSize: 15, lineHeight: 1.6, margin: 0 }}>{stat.text}</Typography.Paragraph>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  )
}
