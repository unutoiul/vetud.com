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
          <Image src="/brand/vetud-logo-white.svg" alt="VETUD Peptide Series" width={362} height={76} unoptimized style={{ width: 210, height: "auto", display: "block" }} />
          <span style={{ fontSize: 13 }}>
            © {new Date().getFullYear()} {SITE.brand}. All rights reserved.
          </span>
        </Flex>
      </Container>
    </footer>
  )
}
