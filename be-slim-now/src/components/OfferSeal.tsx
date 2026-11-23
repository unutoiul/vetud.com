"use client"

import { colors, fonts, gradients } from "@/theme/tokens"

/**
 * The offer medallion: a night disc with a champagne rim. The label's words sit above and below the
 * percentage ("BLACK" / "−40%" / "FRIDAY"), large enough to read at card size.
 */
export default function OfferSeal({
  percent,
  label,
  size = 120,
}: {
  percent: number
  label: string
  size?: number | string
}) {
  const words = label.toUpperCase().split(/\s+/)
  const top = words[0] ?? ""
  const bottom = words.slice(1).join(" ") || "OFF"
  return (
    <div
      role="img"
      aria-label={`${label}: ${percent}% off`}
      style={{
        width: size,
        aspectRatio: "1",
        borderRadius: 999,
        padding: 3,
        background: gradients.hot,
        boxShadow: `0 12px 28px ${colors.sealShadow}`,
      }}
    >
      <div style={{ width: "100%", height: "100%", borderRadius: 999, background: colors.night, position: "relative" }}>
        <svg aria-hidden viewBox="0 0 100 100" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
          <circle cx="50" cy="50" r="44" fill="none" stroke={colors.gold} strokeOpacity="0.5" strokeWidth="0.8" />
          <text x="50" y="33" textAnchor="middle" fontFamily={fonts.body} fontSize="10" fontWeight="800" letterSpacing="1.5" fill={colors.goldLight}>
            {top}
          </text>
          <text x="50" y="62" textAnchor="middle" fontFamily={fonts.display} fontSize="30" fontWeight="600" fill={colors.white} letterSpacing="-0.8">
            −{percent}%
          </text>
          <text x="50" y="77" textAnchor="middle" fontFamily={fonts.body} fontSize="10" fontWeight="800" letterSpacing="1.5" fill={colors.goldLight}>
            {bottom}
          </text>
        </svg>
      </div>
    </div>
  )
}
