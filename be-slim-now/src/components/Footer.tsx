"use client"

import { Flex } from "antd"
import Image from "next/image"
import { SITE } from "@/config/site"
import { colors } from "@/theme/tokens"
import { Container } from "./ui"

export default function Footer() {
  return (
    <footer style={{ background: colors.navyDeep, color: colors.onNavyMuted, padding: "36px 0" }}>
      <Container>
        <Flex align="center" justify="space-between" wrap gap={16}>
          <Image src="/brand/beslimnow-logo-white.png" alt="BeSlimNow" width={1200} height={252} sizes="210px" style={{ width: 210, height: "auto", display: "block" }} />
          <span style={{ fontSize: 13 }}>
            © {new Date().getFullYear()} {SITE.brand}. All rights reserved.
          </span>
        </Flex>
      </Container>
    </footer>
  )
}
