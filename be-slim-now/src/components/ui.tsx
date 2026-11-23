"use client"

import { Typography } from "antd"
import type { CSSProperties, ReactNode } from "react"
import { colors, fonts } from "@/theme/tokens"

/** Page width and side gutters shared by every section. */
export function Container({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(16px, 4vw, 32px)", ...style }}>{children}</div>
}

export function Section({
  id,
  children,
  background,
  style,
}: {
  id?: string
  children: ReactNode
  background?: string
  style?: CSSProperties
}) {
  return (
    <section id={id} style={{ padding: "clamp(64px, 9vw, 112px) 0", background, ...style }}>
      <Container>{children}</Container>
    </section>
  )
}

export function Eyebrow({ children, color = colors.blueSoft }: { children: ReactNode; color?: string }) {
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
    <div style={{ textAlign: align, maxWidth: align === "center" ? 720 : undefined, margin: align === "center" ? "0 auto 56px" : "0 0 32px" }}>
      {eyebrow && <Eyebrow color={inverse ? colors.onNavyMuted : colors.blueSoft}>{eyebrow}</Eyebrow>}
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

/** The short blue rule under headings, as on VETUD's artwork. */
export function AccentRule({ align = "left" }: { align?: "center" | "left" }) {
  return (
    <div
      aria-hidden
      style={{
        width: 72,
        height: 2,
        background: `linear-gradient(90deg, ${colors.blue}, ${colors.ice})`,
        margin: align === "center" ? "20px auto" : "20px 0",
      }}
    />
  )
}
