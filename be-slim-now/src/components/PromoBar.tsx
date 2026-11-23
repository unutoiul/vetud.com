"use client"

import { GiftFilled, TagFilled } from "@ant-design/icons"
import { OFFER, bestCombinedPercent } from "@/config/site"
import { colors, fonts } from "@/theme/tokens"
import { useOrder } from "./OrderProvider"

/** The offer strip above the header: night navy, with the numbers in lime. */
export default function PromoBar() {
  const { openPromo } = useOrder()
  if (!OFFER.salePercent) return null
  return (
    <div
      style={{
        position: "relative",
        zIndex: 101,
        background: colors.night,
        color: colors.onNavy,
        fontSize: 14,
        textAlign: "center",
        padding: "10px 16px",
        lineHeight: 1.4,
        borderBottom: `1px solid ${colors.onNavyLine}`,
      }}
    >
      <TagFilled style={{ color: colors.green, marginRight: 8 }} />
      <span style={{ fontFamily: fonts.display, fontSize: 15, letterSpacing: "0.02em" }}>
        {OFFER.saleLabel}:{" "}
        <strong style={{ color: colors.limeLight, fontWeight: 700 }}>−{OFFER.salePercent}% on every pen</strong>
      </span>
      <span style={{ opacity: 0.45, margin: "0 12px" }}>|</span>
      <button
        type="button"
        onClick={openPromo}
        style={{
          background: "none",
          border: 0,
          padding: 0,
          color: colors.onNavy,
          font: "inherit",
          fontWeight: 700,
          textDecoration: "underline",
          textUnderlineOffset: 3,
          textDecorationColor: colors.green,
          cursor: "pointer",
        }}
      >
        <GiftFilled style={{ color: colors.green, marginRight: 6 }} />
        Subscribe for an extra −{OFFER.subscriberPercent}% (up to −{bestCombinedPercent()}%)
      </button>
    </div>
  )
}
