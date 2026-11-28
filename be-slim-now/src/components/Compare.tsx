"use client"

import { CheckCircleFilled, ShoppingOutlined } from "@ant-design/icons"
import { Button, Grid } from "antd"
import type { ReactNode } from "react"
import { OFFER, PRODUCTS, PRODUCT_IDS, STRENGTHS, strengthLabel, type ProductId, type Strength } from "@/config/site"
import { format } from "@/i18n/format"
import Image from "next/image"
import { colors, fonts, gradients, shadows } from "@/theme/tokens"
import { useCountry } from "./CountryProvider"
import { useMessages } from "./MessagesProvider"
import { useOrder } from "./OrderProvider"
import { Section, SectionHeading } from "./ui"

type Row = { key: string; label: string; cells: Record<ProductId, ReactNode>; strong?: boolean }

/** Regular price struck through, then the offer price, in the visitor's currency. */
function Strike({ product, strength }: { product: ProductId; strength: Strength }) {
  const { priceOf, money } = useCountry()
  const { regular, sale } = priceOf(product, strength)
  return (
    <span>
      <span style={{ textDecoration: "line-through", color: colors.muted, marginRight: 8, fontWeight: 400 }}>
        {money(regular)}
      </span>
      <span style={{ color: colors.navy, fontWeight: 700 }}>{money(sale)}</span>
    </span>
  )
}

function PerMg({ product }: { product: ProductId }) {
  const { pricePerMg, money } = useCountry()
  return <>{money(pricePerMg(product, "40mg"))}</>
}

const Yes = ({ children }: { children: ReactNode }) => (
  <span style={{ display: "inline-flex", alignItems: "flex-start", gap: 8 }}>
    <CheckCircleFilled style={{ color: colors.success, marginTop: 4 }} />
    {children}
  </span>
)

/** The text rows (compare.rows in the messages); these get a check mark. */
const CHECKED = new Set(["box", "purity", "dispatch"])

/** Every row of the table: the facts from the messages, then the prices in the visitor's currency. */
function useRows(): Row[] {
  const m = useMessages()
  const t = m.compare
  const facts = Object.entries(t.rows).map(([key, row]) => ({
    key,
    label: row.label,
    cells: Object.fromEntries(
      PRODUCT_IDS.map((id) => [id, CHECKED.has(key) ? <Yes>{row[id]}</Yes> : row[id]]),
    ) as Record<ProductId, ReactNode>,
  }))
  const prices = STRENGTHS.map((strength) => ({
    key: `price-${strength}`,
    label: format(t.priceRow, {
      strength: strengthLabel(strength),
      saleLabel: m.offer.saleLabel,
      percent: OFFER.salePercent,
    }),
    cells: Object.fromEntries(
      PRODUCT_IDS.map((id) => [id, <Strike key={id} product={id} strength={strength} />]),
    ) as Record<ProductId, ReactNode>,
    strong: true,
  }))
  const perMg = {
    key: "per-mg",
    label: t.perMgRow,
    cells: { tz2: <PerMg product="tz2" />, retatrutide: <PerMg product="retatrutide" /> },
  }
  return [...facts, ...prices, perMg]
}

export default function Compare() {
  const { openOrder } = useOrder()
  const m = useMessages()
  const rows = useRows()
  const screens = Grid.useBreakpoint()
  const labelWidth = screens.md ? "220px" : "96px"

  return (
    <Section id="compare" background={colors.paper}>
      <SectionHeading eyebrow={m.compare.eyebrow} title={m.compare.title} subtitle={m.compare.subtitle} />
      <div
        style={{
          borderRadius: 24,
          overflow: "hidden",
          border: `1px solid ${colors.line}`,
          boxShadow: shadows.lifted,
          background: colors.white,
        }}
      >
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: `${labelWidth} 1fr 1fr`, background: colors.navyDeep }}>
          <div />
          {PRODUCT_IDS.map((id) => {
            const product = PRODUCTS[id]
            const hot = product.tone === "hot"
            return (
              <div
                key={id}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  minHeight: screens.md ? 132 : 104,
                  padding: screens.md ? "22px 24px" : "16px 12px",
                  borderLeft: `1px solid ${colors.onNavyLine}`,
                  borderTop: hot ? `3px solid ${colors.green}` : `3px solid ${colors.clear}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                }}
              >
                {/* Each molecule's artwork from vetud.com */}
                <Image
                  src={product.art}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 40vw, 480px"
                  style={{ objectFit: "cover", objectPosition: "center" }}
                />
                <div aria-hidden style={{ position: "absolute", inset: 0, background: gradients.artFade }} />
                <div
                  style={{
                    position: "relative",
                    fontFamily: fonts.mono,
                    fontSize: 10.5,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: hot ? colors.limeLight : colors.tealBright,
                  }}
                >
                  {m.products[id].badge}
                </div>
                <div
                  style={{
                    position: "relative",
                    fontFamily: fonts.display,
                    fontSize: screens.md ? 30 : 20,
                    fontWeight: 500,
                    color: colors.white,
                    lineHeight: 1.15,
                    marginTop: 4,
                  }}
                >
                  {product.name}
                </div>
              </div>
            )
          })}
        </div>
        {/* Rows */}
        {rows.map((row, index) => (
          <div
            key={row.key}
            style={{
              display: "grid",
              gridTemplateColumns: `${labelWidth} 1fr 1fr`,
              background: index % 2 ? colors.aquaWash : colors.white,
              borderTop: `1px solid ${colors.line}`,
              fontSize: screens.md ? 15 : 13,
            }}
          >
            <div
              style={{
                padding: screens.md ? "16px 24px" : "12px 12px",
                color: colors.muted,
                fontWeight: 600,
                fontSize: screens.md ? 13 : 11.5,
                letterSpacing: "0.02em",
              }}
            >
              {row.label}
            </div>
            {PRODUCT_IDS.map((id) => (
              <div
                key={id}
                style={{
                  padding: screens.md ? "16px 24px" : "12px 12px",
                  borderLeft: `1px solid ${colors.line}`,
                  color: colors.navyInk,
                  fontWeight: row.strong ? 700 : 500,
                  fontSize: row.strong ? (screens.md ? 18 : 15) : undefined,
                  lineHeight: 1.5,
                }}
              >
                {row.cells[id]}
              </div>
            ))}
          </div>
        ))}
        {/* Buttons */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `${labelWidth} 1fr 1fr`,
            borderTop: `1px solid ${colors.line}`,
            background: colors.white,
          }}
        >
          <div />
          {PRODUCT_IDS.map((id) => {
            return (
              <div
                key={id}
                style={{
                  minWidth: 0,
                  padding: screens.md ? "20px 24px" : "14px 10px",
                  borderLeft: `1px solid ${colors.line}`,
                }}
              >
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={screens.sm ? <ShoppingOutlined /> : undefined}
                  onClick={() => openOrder({ product: id })}
                  style={{
                    height: screens.md ? 54 : 46,
                    fontSize: screens.md ? 16 : 14,
                    padding: screens.sm ? undefined : "0 8px",
                  }}
                >
                  {screens.md ? format(m.compare.buyProduct, { product: PRODUCTS[id].name }) : m.compare.buy}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </Section>
  )
}
