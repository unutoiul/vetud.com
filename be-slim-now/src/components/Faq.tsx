"use client"

import { Col, Collapse, Row } from "antd"
import { contactLinks } from "@/config/site"
import { format } from "@/i18n/format"
import { colors, fonts } from "@/theme/tokens"
import { useMessages } from "./MessagesProvider"
import { Section, SectionHeading } from "./ui"

/** The questions and answers are faq.items in the messages; {contacts} becomes the chat links. */
export default function Faq() {
  const m = useMessages()
  const contacts = contactLinks()
    .map((link) => `${m.contact.apps[link.key]} ${link.value}`)
    .join(" · ")
  return (
    <Section id="faq" background={colors.paper}>
      <Row justify="center">
        <Col xs={24} lg={18}>
          <SectionHeading eyebrow={m.faq.eyebrow} title={m.faq.title} />
          <Collapse
            accordion
            size="large"
            expandIconPlacement="end"
            defaultActiveKey={["0"]}
            style={{ background: colors.white, borderColor: colors.line }}
            items={m.faq.items.map((item, index) => ({
              key: String(index),
              label: <span style={{ fontFamily: fonts.display, fontSize: 19, fontWeight: 500, color: colors.navy }}>{item.q}</span>,
              children: <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: colors.muted }}>{format(item.a, { contacts })}</p>,
            }))}
          />
        </Col>
      </Row>
    </Section>
  )
}
