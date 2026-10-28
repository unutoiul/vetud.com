import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import type { CSSProperties, ReactNode } from "react"

// Navy-and-glacier palette, shared with the storefront theme (src/theme/tokens.ts).
export const colors = {
  navy: "#15265e",
  ink: "#192b4a",
  teal: "#3268aa",
  mint: "#cbd6e6",
  mintLight: "#edf3fb",
  paper: "#fbfcfe",
  line: "#e2e8f0",
  muted: "#67758b",
  onNavyMuted: "#abcce3",
}

const fontFamily = "Manrope, 'Helvetica Neue', Arial, sans-serif"
const monoFamily = "'DM Mono', 'SFMono-Regular', Menlo, monospace"

export const styles: Record<string, CSSProperties> = {
  eyebrow: {
    fontFamily: monoFamily,
    fontSize: "11px",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: colors.teal,
    margin: "0 0 8px",
  },
  heading: {
    fontSize: "26px",
    lineHeight: "1.2",
    letterSpacing: "-0.02em",
    fontWeight: 600,
    color: colors.ink,
    margin: "0 0 12px",
  },
  text: {
    fontSize: "15px",
    lineHeight: "1.65",
    color: colors.ink,
    margin: "0 0 12px",
  },
  muted: {
    fontSize: "13px",
    lineHeight: "1.6",
    color: colors.muted,
    margin: "0",
  },
  panel: {
    backgroundColor: colors.mintLight,
    border: `1px solid ${colors.mint}`,
    borderRadius: "6px",
    padding: "16px 18px",
    margin: "20px 0",
  },
  button: {
    backgroundColor: colors.navy,
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    textDecoration: "none",
    padding: "13px 20px",
    borderRadius: "3px",
    display: "inline-block",
  },
  hr: { borderColor: colors.line, margin: "24px 0" },
}

type EmailLayoutProps = {
  preview: string
  children: ReactNode
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: colors.paper, fontFamily, margin: 0, padding: "24px 0" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff", border: `1px solid ${colors.line}` }}>
          <Section style={{ backgroundColor: colors.navy, padding: "22px 32px" }}>
            <Text style={{ margin: 0, color: "#f5f9fb", fontSize: "17px", fontWeight: 800, letterSpacing: "0.13em" }}>
              VETUD
            </Text>
            <Text style={{ margin: "2px 0 0", color: colors.onNavyMuted, fontFamily: monoFamily, fontSize: "10px", letterSpacing: "0.22em" }}>
              PEPTIDE SERIES
            </Text>
          </Section>
          <Section style={{ padding: "32px" }}>{children}</Section>
          <Section style={{ padding: "0 32px 28px" }}>
            <Hr style={styles.hr} />
            <Text style={styles.muted}>
              All Vetud products are sold strictly for laboratory research use only. Not for human or
              veterinary use. This email does not provide medical advice.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
