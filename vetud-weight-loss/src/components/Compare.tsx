"use client"

import { CheckCircleFilled, ShoppingOutlined } from "@ant-design/icons"
import { Button, Grid } from "antd"
import type { ReactNode } from "react"
import { OFFER, PRODUCTS, PRODUCT_IDS, formatUsd, priceOf, pricePerMg, type ProductId } from "@/config/site"
import Image from "next/image"
import { colors, fonts, gradients, shadows } from "@/theme/tokens"
import { useOrder } from "./OrderProvider"
import { Section, SectionHeading } from "./ui"

type Row = { label: string; cells: Record<ProductId, ReactNode>; strong?: boolean }

const Strike = ({ regular, sale }: { regular: number; sale: number }) => (
  <span>
    <span style={{ textDecoration: "line-through", color: colors.muted, marginRight: 8, fontWeight: 400 }}>{formatUsd(regular)}</span>
    <span style={{ color: colors.navy, fontWeight: 700 }}>{formatUsd(sale)}</span>
  </span>
)

const Yes = ({ children }: { children: ReactNode }) => (
  <span style={{ display: "inline-flex", alignItems: "flex-start", gap: 8 }}>
    <CheckCircleFilled style={{ color: colors.success, marginTop: 4 }} />
    {children}
  </span>
)

const ROWS: Row[] = [
  { label: "Label on the pen", cells: { tz2: "TZ-2", retatrutide: "Retatrutide" } },
  { label: "What it is", cells: { tz2: "Dual agonist: GIP + GLP-1 receptors", retatrutide: "Triple agonist: GIP + GLP-1 + glucagon receptors" } },
  { label: "Generation", cells: { tz2: "Current generation · the most requested", retatrutide: "Next generation · the newest" } },
  { label: "Development status", cells: { tz2: "Molecule approved as a medicine", retatrutide: "Investigational, in phase 3 trials" } },
  { label: "Strengths", cells: { tz2: "20 mg · 40 mg", retatrutide: "20 mg · 40 mg" } },
  { label: "In the box", cells: { tz2: <Yes>1 pen · 12 needles · booklet</Yes>, retatrutide: <Yes>1 pen · 12 needles · booklet</Yes> } },
  { label: "Purity", cells: { tz2: <Yes>≥99%, COA for the lot</Yes>, retatrutide: <Yes>≥99%, COA for the lot</Yes> } },
  { label: "Dispatch", cells: { tz2: <Yes>Within 24 h of payment</Yes>, retatrutide: <Yes>Within 24 h of payment</Yes> } },
  {
    label: `20 mg · ${OFFER.saleLabel.toLowerCase()} −${OFFER.salePercent}%`,
    cells: { tz2: <Strike {...priceOf("tz2", "20mg")} />, retatrutide: <Strike {...priceOf("retatrutide", "20mg")} /> },
    strong: true,
  },
  {
    label: `40 mg · ${OFFER.saleLabel.toLowerCase()} −${OFFER.salePercent}%`,
    cells: { tz2: <Strike {...priceOf("tz2", "40mg")} />, retatrutide: <Strike {...priceOf("retatrutide", "40mg")} /> },
    strong: true,
  },
  { label: "Price per mg (40 mg)", cells: { tz2: `$${pricePerMg("tz2", "40mg").toFixed(2)}`, retatrutide: `$${pricePerMg("retatrutide", "40mg").toFixed(2)}` } },
]

export default function Compare() {
  const { openOrder } = useOrder()
  const screens = Grid.useBreakpoint()
  const labelWidth = screens.md ? "220px" : "96px"

  return (
    <Section id="compare" background={colors.paper}>
      <SectionHeading
        eyebrow="Side by side"
        title="Which pen is yours?"
        subtitle="Two molecules, one pen, one price per mg to compare. Both ship with the same purity, the same box and the same offer."
      />
      <div style={{ borderRadius: 24, overflow: "hidden", border: `1px solid ${colors.line}`, boxShadow: shadows.lifted, background: colors.white }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: `${labelWidth} 1fr 1fr`, background: colors.navyDeep }}>
          <div />
          {PRODUCT_IDS.map((id) => {
            const product = PRODUCTS[id]
            const hot = product.badge.tone === "hot"
            return (
              <div
                key={id}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  minHeight: screens.md ? 132 : 104,
                  padding: screens.md ? "22px 24px" : "16px 12px",
                  borderLeft: `1px solid ${colors.onNavyLine}`,
                  borderTop: hot ? `3px solid ${colors.gold}` : `3px solid ${colors.clear}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                }}
              >
                {/* Each molecule's artwork from vetud.com */}
                <Image src={product.art} alt="" fill sizes="(max-width: 768px) 40vw, 480px" style={{ objectFit: "cover", objectPosition: "center" }} />
                <div aria-hidden style={{ position: "absolute", inset: 0, background: gradients.artFade }} />
                <div style={{ position: "relative", fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: hot ? colors.goldLight : colors.ribbonIce }}>
                  {product.badge.text}
                </div>
                <div style={{ position: "relative", fontFamily: fonts.display, fontSize: screens.md ? 30 : 20, fontWeight: 500, color: colors.white, lineHeight: 1.15, marginTop: 4 }}>
                  {product.name}
                </div>
              </div>
            )
          })}
        </div>
        {/* Rows */}
        {ROWS.map((row, index) => (
          <div
            key={row.label}
            style={{
              display: "grid",
              gridTemplateColumns: `${labelWidth} 1fr 1fr`,
              background: index % 2 ? colors.iceWash : colors.white,
              borderTop: `1px solid ${colors.line}`,
              fontSize: screens.md ? 15 : 13,
            }}
          >
            <div style={{ padding: screens.md ? "16px 24px" : "12px 12px", color: colors.muted, fontWeight: 600, fontSize: screens.md ? 13 : 11.5, letterSpacing: "0.02em" }}>
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
        <div style={{ display: "grid", gridTemplateColumns: `${labelWidth} 1fr 1fr`, borderTop: `1px solid ${colors.line}`, background: colors.white }}>
          <div />
          {PRODUCT_IDS.map((id) => {
            return (
              <div key={id} style={{ padding: screens.md ? "20px 24px" : "14px 12px", borderLeft: `1px solid ${colors.line}` }}>
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<ShoppingOutlined />}
                  onClick={() => openOrder({ product: id })}
                  style={{ height: screens.md ? 54 : 46, fontSize: screens.md ? 16 : 14 }}
                >
                  {screens.md ? `Buy ${PRODUCTS[id].name}` : "Buy now"}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </Section>
  )
}
