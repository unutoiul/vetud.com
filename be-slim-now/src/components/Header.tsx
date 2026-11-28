"use client"

import { Flex, Grid } from "antd"
import Image from "next/image"
import { useEffect, useState } from "react"
import { colors, fonts } from "@/theme/tokens"
import CountrySelect from "./CountrySelect"
import { useMessages } from "./MessagesProvider"
import { Container } from "./ui"

/** Section anchors, with their labels from header.nav in the messages. */
const NAV = [
  { href: "#products", key: "products" },
  { href: "#dual-chamber", key: "dualChamber" },
  { href: "#compare", key: "compare" },
  { href: "#how", key: "how" },
  { href: "#faq", key: "faq" },
] as const

export default function Header() {
  const m = useMessages()
  const screens = Grid.useBreakpoint()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: scrolled ? colors.glass : "transparent",
        backdropFilter: scrolled ? "saturate(160%) blur(14px)" : undefined,
        WebkitBackdropFilter: scrolled ? "saturate(160%) blur(14px)" : undefined,
        borderBottom: `1px solid ${scrolled ? colors.line : "transparent"}`,
        transition: "background 200ms ease, border-color 200ms ease",
      }}
    >
      <Container>
        <Flex align="center" justify="space-between" gap={12} style={{ height: 80 }}>
          <a href="#top" aria-label={m.header.backToTop} style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
            <Image
              src="/brand/beslimnow-logo.png"
              alt={m.header.logoAlt}
              width={1200}
              height={252}
              sizes="228px"
              priority
              // On narrow phones the logo gives up a little width so the country picker fits beside it.
              style={{
                width: screens.md ? 228 : "clamp(140px, calc(100vw - 172px), 184px)",
                height: "auto",
                display: "block",
              }}
            />
          </a>
          {screens.lg && (
            <nav aria-label={m.header.navLabel}>
              <Flex gap={32}>
                {NAV.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    style={{
                      color: colors.navyInk,
                      textDecoration: "none",
                      fontSize: 14,
                      fontWeight: 500,
                      fontFamily: fonts.body,
                    }}
                  >
                    {m.header.nav[item.key]}
                  </a>
                ))}
              </Flex>
            </nav>
          )}
          <div style={{ flex: "none" }}>
            <CountrySelect size={screens.sm ? "large" : "middle"} />
          </div>
        </Flex>
      </Container>
    </header>
  )
}
