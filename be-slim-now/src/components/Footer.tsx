"use client"

import { Flex } from "antd"
import Image from "next/image"
import { SITE } from "@/config/site"
import { colors } from "@/theme/tokens"
import { format } from "@/i18n/format"
import { ANALYTICS_ENABLED } from "@/lib/analytics"
import { openCookieSettings } from "./CookieConsent"
import { useMessages } from "./MessagesProvider"
import { Container } from "./ui"

export default function Footer() {
  const m = useMessages()
  return (
    <footer style={{ background: colors.navyDeep, color: colors.onNavyMuted, padding: "36px 0" }}>
      <Container>
        <Flex align="center" justify="space-between" wrap gap={16}>
          <Image
            src="/brand/beslimnow-logo-white.png"
            alt={m.footer.logoAlt}
            width={1200}
            height={252}
            sizes="210px"
            style={{ width: 210, height: "auto", display: "block" }}
          />
          <Flex align="center" wrap gap={16} style={{ fontSize: 13 }}>
            {ANALYTICS_ENABLED && (
              <button
                type="button"
                onClick={openCookieSettings}
                style={{
                  background: "none",
                  border: 0,
                  padding: 0,
                  font: "inherit",
                  color: "inherit",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                {m.consent.settings}
              </button>
            )}
            <span>{format(m.footer.copyright, { year: new Date().getFullYear(), brand: SITE.brand })}</span>
          </Flex>
        </Flex>
      </Container>
    </footer>
  )
}
