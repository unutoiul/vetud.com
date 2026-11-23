"use client"

import { Typography } from "antd"
import type { CSSProperties, ReactNode } from "react"
import { colors, fonts } from "@/theme/tokens"

/** Page width and side gutters shared by every section. */
export function Container({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(16px, 4vw, 32px)", ...style }}>{children}</div>
}

/** Space above and below every section's content (two of these sit between neighbouring sections). */
export const SECTION_PADDING = "clamp(48px, 6.5vw, 80px) 0"

/** Top space for a section that continues the section above in the same background colour. */
const JOINED_TOP = "clamp(8px, 1.5vw, 16px)"

export function Section({
  id,
  children,
  background,
  joined = false,
  style,
}: {
  id?: string
  children: ReactNode
  background?: string
  /**
   * Set when the section above has the same background. Without a colour change the two paddings
   * read as one big empty band, so this section starts almost straight after the one above.
   */
  joined?: boolean
  style?: CSSProperties
}) {
  return (
    <section id={id} style={{ padding: SECTION_PADDING, ...(joined && { paddingTop: JOINED_TOP }), background, ...style }}>
      <Container>{children}</Container>
    </section>
  )
}

export function Eyebrow({ children, color = colors.tealDeep }: { children: ReactNode; color?: string }) {
  return (
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 12,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color,
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  inverse = false,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  align?: "center" | "left"
  inverse?: boolean
}) {
  return (
    <div style={{ textAlign: align, maxWidth: align === "center" ? 720 : undefined, margin: align === "center" ? "0 auto clamp(32px, 4vw, 48px)" : "0 0 32px" }}>
      {eyebrow && <Eyebrow color={inverse ? colors.onNavyMuted : colors.tealDeep}>{eyebrow}</Eyebrow>}
      <Typography.Title
        level={2}
        style={{
          fontFamily: fonts.display,
          fontWeight: 400,
          fontSize: "clamp(30px, 4.4vw, 48px)",
          lineHeight: 1.1,
          letterSpacing: "-0.01em",
          color: inverse ? colors.onNavy : colors.navy,
          margin: 0,
        }}
      >
        {title}
      </Typography.Title>
      <AccentRule align={align} />
      {subtitle && (
        <Typography.Paragraph style={{ fontSize: 17, lineHeight: 1.65, color: inverse ? colors.onNavyMuted : colors.muted, margin: 0 }}>
          {subtitle}
        </Typography.Paragraph>
      )}
    </div>
  )
}

/** The short teal rule under headings. */
export function AccentRule({ align = "left" }: { align?: "center" | "left" }) {
  return (
    <div
      aria-hidden
      style={{
        width: 72,
        height: 2,
        background: `linear-gradient(90deg, ${colors.teal}, ${colors.aqua})`,
        margin: align === "center" ? "20px auto" : "20px 0",
      }}
    />
  )
}
