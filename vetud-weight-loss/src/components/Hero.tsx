"use client"

import { CheckCircleFilled, GiftFilled, ShoppingOutlined } from "@ant-design/icons"
import { Button, Col, Flex, Row, Typography } from "antd"
import Image from "next/image"
import { OFFER, PRODUCTS, formatUsd, lowestPrice, priceOf, type ProductId } from "@/config/site"
import { colors, fonts, gradients, shadows } from "@/theme/tokens"
import OfferSeal from "./OfferSeal"
import { useOrder } from "./OrderProvider"
import { AccentRule, Container, Eyebrow } from "./ui"

const TRUST = ["≥99% purity, HPLC verified", "COA with every lot", "Ships within 24 h", "Discreet packaging"]

function PenTag({ id, onClick }: { id: ProductId; onClick: () => void }) {
  const product = PRODUCTS[id]
  const { regular, sale } = priceOf(id, "20mg")
  const hot = product.badge.tone === "hot"
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "block",
        textAlign: "left",
        cursor: "pointer",
        background: colors.white,
        border: `1px solid ${hot ? colors.gold : colors.line}`,
        borderRadius: 14,
        padding: "10px 16px",
        boxShadow: shadows.lifted,
        whiteSpace: "nowrap",
      }}
    >
      <div style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: hot ? colors.sale : colors.blueSoft, fontWeight: 600 }}>
        {product.badge.text}
      </div>
      <div style={{ fontFamily: fonts.display, fontSize: 20, fontWeight: 500, color: colors.navy, lineHeight: 1.2 }}>
        {product.name}
        {product.label ? <span style={{ fontSize: 13, color: colors.muted }}> · {product.label}</span> : null}
      </div>
      <div style={{ fontSize: 14 }}>
        <span style={{ color: colors.muted, textDecoration: "line-through", marginRight: 6 }}>{formatUsd(regular)}</span>
        <span style={{ color: colors.navy, fontWeight: 700 }}>from {formatUsd(sale)}</span>
      </div>
    </button>
  )
}

export default function Hero() {
  const { openOrder, openPromo } = useOrder()

  return (
    <section id="top" style={{ position: "relative", overflow: "hidden", background: gradients.hero, marginTop: -72, paddingTop: 72 }}>
      {/* VETUD's alpine artwork, faded into the page */}
      <div aria-hidden style={{ position: "absolute", inset: 0, opacity: 0.75 }}>
        <Image src="/images/alpine.webp" alt="" fill priority sizes="100vw" style={{ objectFit: "cover", objectPosition: "center bottom" }} />
        <div style={{ position: "absolute", inset: 0, background: gradients.heroSide }} />
        <div style={{ position: "absolute", inset: 0, background: gradients.heroScrim }} />
      </div>

      <Container style={{ position: "relative" }}>
        <Row gutter={[{ xs: 16, md: 48 }, 32]} align="middle" style={{ minHeight: "min(84vh, 780px)", padding: "clamp(32px, 5vw, 64px) 0 clamp(48px, 6vw, 72px)" }}>
          <Col xs={24} md={12}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 18,
                padding: "6px 14px 6px 6px",
                borderRadius: 999,
                background: colors.night,
                color: colors.onNavy,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <span style={{ background: gradients.hot, color: colors.navyDeep, borderRadius: 999, padding: "3px 10px", fontWeight: 800, letterSpacing: "0.08em", fontSize: 11.5 }}>
                {OFFER.saleLabel.toUpperCase()}
              </span>
              −{OFFER.salePercent}% on every pen, both strengths
            </span>
            <Eyebrow>VETUD Peptide Series · The pens everyone is asking for</Eyebrow>
            <Typography.Title
              level={1}
              style={{
                fontFamily: fonts.display,
                fontWeight: 300,
                fontSize: "clamp(38px, 4.8vw, 62px)",
                lineHeight: 1.04,
                letterSpacing: "-0.02em",
                color: colors.navy,
                margin: 0,
              }}
            >
              Tirzepatide &amp; Retatrutide
              <br />
              <span style={{ fontWeight: 600 }}>
                pens, now <span style={{ color: colors.sale }}>{OFFER.salePercent}% off.</span>
              </span>
            </Typography.Title>
            <AccentRule />
            <Typography.Paragraph style={{ fontSize: "clamp(16px, 1.5vw, 18px)", lineHeight: 1.65, color: colors.navyInk, maxWidth: 520, margin: 0 }}>
              The two most-wanted molecules in metabolic research, sealed in VETUD&apos;s precision dual-chamber pen. 20 mg or 40 mg, ≥99% purity, 12 needles in
              the box, at your door within days. One short form. No account, no cart, no waiting.
            </Typography.Paragraph>

            <Flex wrap gap={12} style={{ marginTop: 30 }}>
              <Button
                type="primary"
                size="large"
                icon={<ShoppingOutlined />}
                onClick={() => openOrder()}
                style={{ height: 58, padding: "0 30px", fontSize: 18 }}
              >
                Buy now · from {formatUsd(lowestPrice())}
              </Button>
              <Button
                size="large"
                icon={<GiftFilled />}
                onClick={openPromo}
                style={{ height: 58, padding: "0 22px", fontSize: 16, fontWeight: 600, color: colors.navy, borderColor: colors.gold, background: colors.white }}
              >
                Extra −{OFFER.subscriberPercent}% code
              </Button>
            </Flex>

            <Flex wrap gap="10px 22px" style={{ marginTop: 26 }}>
              {TRUST.map((item) => (
                <span key={item} style={{ fontSize: 14, color: colors.navyInk, display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <CheckCircleFilled style={{ color: colors.blue }} />
                  {item}
                </span>
              ))}
            </Flex>
          </Col>

          {/* The two VETUD pens, side by side on the diagonal */}
          <Col xs={24} md={12}>
            <div style={{ position: "relative", aspectRatio: "1 / 0.92", maxWidth: 600, margin: "0 auto" }}>
              <div style={{ position: "absolute", left: "0%", top: "0%", width: "80%", aspectRatio: "857 / 760" }}>
                <Image src="/images/vetud-pen.webp" alt="VETUD Tirzepatide pen" fill priority sizes="(max-width: 768px) 80vw, 480px" style={{ objectFit: "contain" }} />
              </div>
              <div style={{ position: "absolute", left: "20%", top: "20%", width: "80%", aspectRatio: "857 / 760" }}>
                <Image src="/images/vetud-pen.webp" alt="VETUD Retatrutide pen" fill priority sizes="(max-width: 768px) 80vw, 480px" style={{ objectFit: "contain" }} />
              </div>

              <div style={{ position: "absolute", left: 0, bottom: "4%" }}>
                <PenTag id="tz2" onClick={() => openOrder({ product: "tz2" })} />
              </div>
              <div style={{ position: "absolute", right: 0, top: "2%" }}>
                <PenTag id="retatrutide" onClick={() => openOrder({ product: "retatrutide" })} />
              </div>

              {OFFER.salePercent > 0 && (
                <div style={{ position: "absolute", right: "4%", bottom: "4%" }}>
                  <OfferSeal percent={OFFER.salePercent} label={OFFER.saleLabel} size="clamp(96px, 10vw, 132px)" />
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  )
}
