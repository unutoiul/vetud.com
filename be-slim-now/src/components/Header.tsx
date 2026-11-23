"use client"

import { ShoppingOutlined } from "@ant-design/icons"
import { Button, Flex, Grid } from "antd"
import Image from "next/image"
import { useEffect, useState } from "react"
import { colors, fonts } from "@/theme/tokens"
import CountrySelect from "./CountrySelect"
import { useOrder } from "./OrderProvider"
import { Container } from "./ui"

const NAV = [
  { href: "#products", label: "Pens" },
  { href: "#dual-chamber", label: "The pen" },
  { href: "#compare", label: "Compare" },
  { href: "#how", label: "How to order" },
  { href: "#faq", label: "FAQ" },
]

export default function Header() {
  const { openOrder } = useOrder()
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
          <a href="#top" aria-label="VETUD Peptide Series, back to top" style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
            <Image
              src="/brand/vetud-logo.svg"
              alt="VETUD Peptide Series"
              width={362}
              height={76}
              priority
              unoptimized
              // On narrow phones the logo gives up a little width so the country picker and the button fit.
              style={{ width: screens.md ? 228 : "clamp(136px, calc(100vw - 222px), 176px)", height: "auto", display: "block" }}
            />
          </a>
          {screens.lg && (
            <nav aria-label="Sections">
              <Flex gap={32}>
                {NAV.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    style={{ color: colors.navyInk, textDecoration: "none", fontSize: 14, fontWeight: 500, fontFamily: fonts.body }}
                  >
                    {item.label}
                  </a>
                ))}
              </Flex>
            </nav>
          )}
          <Flex align="center" gap={screens.sm ? 12 : 8} style={{ flex: "none" }}>
            <CountrySelect compact={!screens.sm} size={screens.sm ? "large" : "middle"} />
            <Button type="primary" size={screens.sm ? "large" : "middle"} icon={screens.sm ? <ShoppingOutlined /> : undefined} onClick={() => openOrder()}>
              Order now
            </Button>
          </Flex>
        </Flex>
      </Container>
    </header>
  )
}
