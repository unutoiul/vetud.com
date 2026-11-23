"use client"

import { Col, Collapse, Row } from "antd"
import { SITE, contactLinks } from "@/config/site"
import { colors, fonts } from "@/theme/tokens"
import { Section, SectionHeading } from "./ui"

const QUESTIONS = [
  {
    q: "How do I pay?",
    a: "After you place your order you get an email right away with the payment details and your order number. Nothing is charged on this page. Use your order number as the payment reference.",
  },
  {
    q: "How fast do you ship?",
    a: "Orders ship within 24 hours of payment (business days), with a tracking number sent by email and, if you chose one, on your messaging app.",
  },
  {
    q: "What do your guarantees cover?",
    a: "Two things. Purity: every lot is tested, and if a lot tests below 99% purity we refund it. Delivery: if your parcel is lost on the way, we reship it or refund you. Message us with your order number and we'll sort it out.",
  },
  {
    q: "What's in the box?",
    a: "Each VETUD box holds one pen in the strength you chose, 12 disposable needles and an instruction booklet, labelled with the product and lot. The outer packaging is plain and discreet.",
  },
  {
    q: "What's the difference between 20 mg and 40 mg?",
    a: "The amount of peptide in the pen. The 40 mg pen costs less per mg, which is why it's marked Best value.",
  },
  {
    q: "Can I get the certificate of analysis (COA)?",
    a: "Yes. Every lot is tested for purity. Message us with your order number and we'll send the COA for the lot you received.",
  },
  {
    q: "Can I change or cancel my order?",
    a: `Yes, until it ships. Reply to your confirmation email or message us: ${contactLinks()
      .map((link) => `${link.label} ${link.value}`)
      .join(" · ")}.`,
  },
  {
    q: "What are these products for?",
    a: SITE.ruoNotice,
  },
]

export default function Faq() {
  return (
    <Section id="faq" background={colors.paper}>
      <Row justify="center">
        <Col xs={24} lg={18}>
          <SectionHeading eyebrow="FAQ" title="Questions, answered." />
          <Collapse
            accordion
            size="large"
            expandIconPlacement="end"
            defaultActiveKey={["0"]}
            style={{ background: colors.white, borderColor: colors.line }}
            items={QUESTIONS.map((item, index) => ({
              key: String(index),
              label: <span style={{ fontFamily: fonts.display, fontSize: 19, fontWeight: 500, color: colors.navy }}>{item.q}</span>,
              children: <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: colors.muted }}>{item.a}</p>,
            }))}
          />
        </Col>
      </Row>
    </Section>
  )
}
