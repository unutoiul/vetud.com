"use client"

import Icon, { MailOutlined, TelegramFilled, WhatsAppOutlined } from "@ant-design/icons"
import type { CSSProperties } from "react"
import type { ContactKey } from "@/config/site"
import { colors } from "@/theme/tokens"

/** LINE's speech bubble. Ant Design has no LINE icon. */
function LineSvg() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden>
      <path d="M12 2.5C6.2 2.5 1.5 6.3 1.5 11c0 4.2 3.7 7.7 8.8 8.4.3.1.8.2.9.5.1.3.1.7 0 1l-.1.9c0 .3-.2 1 .9.6 1.1-.5 5.9-3.5 8.1-6 1.5-1.6 2.3-3.3 2.3-5.4 0-4.7-4.7-8.5-10.4-8.5Z" />
      <text
        x="12"
        y="13.4"
        textAnchor="middle"
        fontSize="5.4"
        fontWeight="800"
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="0.2"
        fill={colors.white}
      >
        LINE
      </text>
    </svg>
  )
}

export const CONTACT_COLORS: Record<ContactKey, string> = {
  telegram: colors.telegram,
  whatsapp: colors.whatsapp,
  line: colors.line_app,
  email: colors.navy,
}

export function ContactIcon({ kind, style }: { kind: ContactKey; style?: CSSProperties }) {
  switch (kind) {
    case "telegram":
      return <TelegramFilled style={style} />
    case "whatsapp":
      return <WhatsAppOutlined style={style} />
    case "line":
      return <Icon component={LineSvg} style={style} />
    default:
      return <MailOutlined style={style} />
  }
}
