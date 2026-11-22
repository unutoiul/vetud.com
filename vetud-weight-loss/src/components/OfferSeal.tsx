"use client"

import { colors, fonts, gradients } from "@/theme/tokens"

/**
 * The "−40%" medallion: a night-navy disc with a champagne ring, like a hallmark. Used on the hero
 * and each product card.
 */
export default function OfferSeal({
  percent,
  label,
  size = 120,
  rotate = 0,
}: {
  percent: number
  label: string
  size?: number | string
  rotate?: number
}) {
  return (
    <div
      role="img"
      aria-label={`${percent}% off, ${label}`}
      style={{
        width: size,
        aspectRatio: "1",
        borderRadius: 999,
        padding: 3,
        background: gradients.hot,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        boxShadow: `0 12px 28px ${colors.sealShadow}`,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 999,
          background: gradients.night,
          display: "grid",
          placeItems: "center",
          position: "relative",
        }}
      >
        <svg aria-hidden viewBox="0 0 100 100" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
          <circle cx="50" cy="50" r="43" fill="none" stroke={colors.gold} strokeOpacity="0.55" strokeWidth="0.6" strokeDasharray="1.2 1.8" />
          <text x="50" y="35" textAnchor="middle" fontFamily={fonts.mono} fontSize="6" letterSpacing="1.6" fill={colors.goldLight}>
            SAVE
          </text>
          <text x="50" y="60" textAnchor="middle" fontFamily={fonts.display} fontSize="24" fontWeight="500" fill={colors.white} letterSpacing="-0.5">
            −{percent}%
          </text>
          <text x="50" y="72" textAnchor="middle" fontFamily={fonts.mono} fontSize="5" letterSpacing="1.2" fill={colors.goldLight}>
            {label.toUpperCase()}
          </text>
        </svg>
      </div>
    </div>
  )
}
