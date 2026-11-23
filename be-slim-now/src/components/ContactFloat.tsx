"use client"

import { CommentOutlined } from "@ant-design/icons"
import { FloatButton } from "antd"
import { contactLinks } from "@/config/site"
import { colors } from "@/theme/tokens"
import { CONTACT_COLORS, ContactIcon } from "./icons/ContactIcon"
import { useMessages } from "./MessagesProvider"

/** Chat shortcuts in the corner of every screen, one per configured app. */
export default function ContactFloat() {
  const links = contactLinks()
  const m = useMessages()
  return (
    <>
      <FloatButton.Group
        trigger="click"
        type="primary"
        icon={<CommentOutlined />}
        tooltip={m.contact.messageUs}
        style={{ insetInlineEnd: 20, insetBlockEnd: 20 }}
      >
        {links.map((link) => (
          <FloatButton
            key={link.key}
            href={link.href}
            target={link.key === "email" ? undefined : "_blank"}
            tooltip={m.contact.apps[link.key]}
            icon={<ContactIcon kind={link.key} style={{ color: CONTACT_COLORS[link.key] }} />}
            aria-label={m.contact.apps[link.key]}
          />
        ))}
      </FloatButton.Group>
      <FloatButton.BackTop style={{ insetInlineEnd: 76, insetBlockEnd: 20, color: colors.navy }} visibilityHeight={900} />
    </>
  )
}
