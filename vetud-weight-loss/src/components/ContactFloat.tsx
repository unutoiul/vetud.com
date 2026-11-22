"use client"

import { CommentOutlined } from "@ant-design/icons"
import { FloatButton } from "antd"
import { contactLinks } from "@/config/site"
import { colors } from "@/theme/tokens"
import { CONTACT_COLORS, ContactIcon } from "./icons/ContactIcon"

/** Chat shortcuts in the corner of every screen, one per configured app. */
export default function ContactFloat() {
  const links = contactLinks()
  return (
    <>
      <FloatButton.Group
        trigger="click"
        type="primary"
        icon={<CommentOutlined />}
        tooltip="Message us"
        style={{ insetInlineEnd: 20, insetBlockEnd: 20 }}
      >
        {links.map((link) => (
          <FloatButton
            key={link.key}
            href={link.href}
            target={link.key === "email" ? undefined : "_blank"}
            tooltip={link.label}
            icon={<ContactIcon kind={link.key} style={{ color: CONTACT_COLORS[link.key] }} />}
            aria-label={link.label}
          />
        ))}
      </FloatButton.Group>
      <FloatButton.BackTop style={{ insetInlineEnd: 76, insetBlockEnd: 20, color: colors.navy }} visibilityHeight={900} />
    </>
  )
}
