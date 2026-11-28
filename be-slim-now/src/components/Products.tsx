"use client"

import { CheckOutlined, FireFilled, GiftFilled, ShoppingOutlined, StarFilled, ZoomInOutlined } from "@ant-design/icons"
import { Button, Col, Flex, Image as AntImage, Row, Segmented, Tag, Typography } from "antd"
import NextImage from "next/image"
import { useState } from "react"
import { OFFER, PRODUCT_IDS, PRODUCTS, STRENGTHS, strengthLabel, type Product, type Strength } from "@/config/site"
import { format } from "@/i18n/format"
import { colors, fonts, gradients, shadows } from "@/theme/tokens"
import { useCountry } from "./CountryProvider"
import { useMessages } from "./MessagesProvider"
import OfferSeal from "./OfferSeal"
import { useOrder } from "./OrderProvider"
import { Section, SectionHeading } from "./ui"

function ProductCard({ product }: { product: Product }) {
  const { openOrder, openPromo } = useOrder()
  const [strength, setStrength] = useState<Strength>("40mg")
  const [shown, setShown] = useState(0)
  const [previewOpen, setPreviewOpen] = useState(false)
  const hot = product.tone === "hot"
  const m = useMessages()
  const text = m.products[product.id]
  const t = m.productsSection
  const { priceOf, pricePerMg, money } = useCountry()
  const { regular, sale } = priceOf(product.id, strength)
  const perMg = pricePerMg(product.id, strength)
  const bulkSaving = Math.round((1 - pricePerMg(product.id, "40mg") / pricePerMg(product.id, "20mg")) * 100)

  return (
    <article
      style={{
        position: "relative",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        background: colors.white,
        border: hot ? `1.5px solid ${colors.green}` : `1px solid ${colors.line}`,
        borderRadius: 24,
        boxShadow: hot ? `0 0 0 5px ${colors.limeWash}, ${shadows.lifted}` : shadows.lifted,
        overflow: "hidden",
      }}
    >
      {/* Badge, big and loud */}
      <div
        style={{
          position: "absolute",
          zIndex: 2,
          top: 18,
          left: 18,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px",
          borderRadius: 999,
          background: hot ? gradients.hot : gradients.popular,
          color: hot ? colors.navyDeep : colors.white,
          fontWeight: 700,
          fontSize: 12.5,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          boxShadow: shadows.card,
        }}
      >
        {hot ? <FireFilled /> : <StarFilled />}
        {text.badge}
      </div>
      {OFFER.salePercent > 0 && (
        <div style={{ position: "absolute", zIndex: 2, top: 10, right: 10 }}>
          <OfferSeal percent={OFFER.salePercent} size={88} />
        </div>
      )}

      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        aria-label={format(t.enlargeAria, { product: text.fullName })}
        style={{
          position: "relative",
          display: "block",
          width: "100%",
          aspectRatio: "16 / 11",
          background: colors.white,
          border: 0,
          padding: 0,
          cursor: "zoom-in",
        }}
      >
        <NextImage
          src={product.gallery[shown]}
          alt={text.gallery[shown]?.alt ?? ""}
          fill
          sizes="(max-width: 768px) 100vw, 560px"
          style={{ objectFit: "contain" }}
        />
        <span
          style={{
            position: "absolute",
            right: 14,
            bottom: 14,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: colors.navyInk,
            background: colors.glass,
            border: `1px solid ${colors.line}`,
            borderRadius: 999,
            padding: "4px 10px",
          }}
        >
          <ZoomInOutlined /> {t.enlarge}
        </span>
      </button>
      <AntImage.PreviewGroup
        items={product.gallery.map((src, index) => ({ src, alt: text.gallery[index]?.alt ?? "" }))}
        preview={{ open: previewOpen, current: shown, onOpenChange: (open) => setPreviewOpen(open) }}
      />
      <Flex gap={12} justify="center" style={{ padding: "0 0 4px", marginTop: -8 }}>
        {product.gallery.map((src, index) => (
          <button
            key={src}
            type="button"
            onClick={() => setShown(index)}
            aria-pressed={shown === index}
            style={{
              position: "relative",
              width: 112,
              height: 84,
              borderRadius: 12,
              overflow: "hidden",
              padding: 0,
              cursor: "pointer",
              background: colors.white,
              border: `2px solid ${shown === index ? colors.navy : colors.line}`,
            }}
          >
            <NextImage
              src={src}
              alt={format(t.thumbAlt, { label: text.gallery[index]?.label ?? "" })}
              fill
              sizes="112px"
              style={{ objectFit: "cover" }}
            />
            <span
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                fontSize: 10,
                fontWeight: 700,
                color: colors.white,
                background: colors.navy,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {text.gallery[index]?.label}
            </span>
          </button>
        ))}
      </Flex>

      <Flex vertical style={{ padding: "24px clamp(20px, 3vw, 36px) 32px", flex: 1 }}>
        <Flex align="center" gap={8} wrap>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: colors.success,
            }}
          >
            <span
              aria-hidden
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: colors.success,
                boxShadow: `0 0 0 3px ${colors.successWash}`,
              }}
            />
            {t.inStock}
          </span>
          <span style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.12em", color: colors.muted }}>
            {product.code}
          </span>
        </Flex>
        <Typography.Title
          level={3}
          style={{ fontFamily: fonts.display, fontWeight: 500, fontSize: 34, color: colors.navy, margin: "12px 0 4px" }}
        >
          {product.name}
          {product.label && (
            <span
              style={{
                marginLeft: 10,
                verticalAlign: "middle",
                fontFamily: fonts.mono,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: colors.navy,
                background: colors.aquaLight,
                border: `1px solid ${colors.aqua}`,
                borderRadius: 6,
                padding: "3px 8px",
              }}
            >
              {product.label}
            </span>
          )}
          <span
            style={{
              display: "block",
              fontSize: 15,
              fontFamily: fonts.body,
              fontWeight: 500,
              color: colors.tealDeep,
              marginTop: 6,
            }}
          >
            {text.tagline}
          </span>
        </Typography.Title>
        <Typography.Paragraph
          style={{ color: colors.muted, fontSize: 15, lineHeight: 1.6, margin: "10px 0 18px", minHeight: "4.8em" }}
        >
          {text.description}
        </Typography.Paragraph>

        <Segmented<Strength>
          block
          size="large"
          value={strength}
          onChange={setStrength}
          options={STRENGTHS.map((value) => ({ value, label: strengthLabel(value) }))}
          aria-label={t.strengthAria}
        />

        {/* Price: regular struck through, offer price big */}
        <Flex align="flex-end" justify="space-between" wrap gap={8} style={{ margin: "22px 0 6px" }}>
          <div>
            {sale < regular && (
              <div style={{ fontSize: 18, color: colors.muted }}>
                <span style={{ textDecoration: "line-through" }}>{money(regular)}</span>
                <span
                  style={{
                    marginLeft: 10,
                    color: colors.saleDeep,
                    background: colors.limeWash,
                    border: `1px solid ${colors.limeLight}`,
                    borderRadius: 999,
                    padding: "2px 10px",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {format(t.saleSave, { percent: OFFER.salePercent, price: money(regular - sale) })}
                </span>
              </div>
            )}
            <span
              style={{ fontFamily: fonts.display, fontSize: 56, lineHeight: 1, color: colors.navy, fontWeight: 500 }}
            >
              {money(sale)}
            </span>
          </div>
          <span style={{ color: colors.muted, fontSize: 14 }}>{format(t.perMg, { price: money(perMg) })}</span>
        </Flex>
        <div style={{ minHeight: 26 }}>
          {strength === "40mg" ? (
            <Tag
              variant="filled"
              style={{ margin: 0, fontWeight: 600, color: colors.tealDeep, background: colors.aquaLight }}
            >
              {format(t.bestValue, { percent: bulkSaving })}
            </Tag>
          ) : (
            <Typography.Link onClick={() => setStrength("40mg")} style={{ fontSize: 13 }}>
              {format(t.switchTo40, { percent: bulkSaving })}
            </Typography.Link>
          )}
        </div>

        <Flex vertical gap={10} style={{ margin: "20px 0 24px" }}>
          {t.features.map((feature) => (
            <span key={feature} style={{ fontSize: 14, color: colors.navyInk, display: "flex", gap: 10 }}>
              <CheckOutlined style={{ color: colors.success, marginTop: 4 }} />
              {feature}
            </span>
          ))}
          <Typography.Link
            onClick={openPromo}
            style={{ fontSize: 14, color: colors.sale, fontWeight: 600, display: "flex", gap: 10 }}
          >
            <GiftFilled style={{ marginTop: 3 }} />
            {format(t.subscriberCode, { percent: OFFER.subscriberPercent })}
          </Typography.Link>
        </Flex>

        <Button
          type="primary"
          size="large"
          block
          icon={<ShoppingOutlined />}
          onClick={() => openOrder({ product: product.id, strength })}
          style={{ height: 58, fontSize: 17, marginTop: "auto" }}
        >
          {format(t.buy, { price: money(sale) })}
        </Button>
        <span style={{ textAlign: "center", fontSize: 12, color: colors.muted, marginTop: 10 }}>{t.nothingToPay}</span>
      </Flex>
    </article>
  )
}

export default function Products() {
  const m = useMessages()
  const t = m.productsSection
  // "The two most-wanted pens." then the offer: "Half price." at exactly 50%, "NN% off." otherwise,
  // nothing when there's no sale, so the heading always follows OFFER.salePercent.
  const offer =
    OFFER.salePercent === 50
      ? t.titleHalf
      : OFFER.salePercent > 0
        ? format(t.titleOff, { percent: OFFER.salePercent })
        : ""
  return (
    <Section id="products" background={colors.paper}>
      <SectionHeading
        eyebrow={format(t.eyebrow, { saleLabel: m.offer.saleLabel, percent: OFFER.salePercent })}
        title={offer ? `${t.title} ${offer}` : t.title}
        subtitle={t.subtitle}
      />
      <Row gutter={[{ xs: 16, md: 32 }, 40]} justify="center">
        {PRODUCT_IDS.map((id) => (
          <Col key={id} xs={24} md={12} style={{ maxWidth: 580 }}>
            <ProductCard product={PRODUCTS[id]} />
          </Col>
        ))}
      </Row>
    </Section>
  )
}
