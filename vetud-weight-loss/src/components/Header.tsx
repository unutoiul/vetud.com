"use client"

import { ShoppingOutlined } from "@ant-design/icons"
import { Button, Flex, Grid } from "antd"
import Image from "next/image"
import { useEffect, useState } from "react"
import { colors, fonts } from "@/theme/tokens"
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
        <Flex align="center" justify="space-between" style={{ height: 72 }}>
          <a href="#top" aria-label="VETUD Peptide Series, back to top" style={{ display: "flex", alignItems: "center" }}>
            <Image src="/brand/vetud-logo.svg" alt="VETUD Peptide Series" width={screens.sm ? 172 : 140} height={screens.sm ? 36 : 29} priority />
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
          <Button type="primary" size={screens.sm ? "large" : "middle"} icon={<ShoppingOutlined />} onClick={() => openOrder()}>
            Order now
          </Button>
        </Flex>
      </Container>
    </header>
  )
}
