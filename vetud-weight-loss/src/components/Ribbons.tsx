"use client"

import { useId, type CSSProperties } from "react"
import { colors } from "@/theme/tokens"

/**
 * Three flowing glass ribbons (lavender, ice, champagne) for night backgrounds, drawn in SVG so they
 * stay sharp at any size and weigh nothing. Purely decorative.
 */
const RIBBONS = [
  {
    color: colors.ribbonLavender,
    d: "M -40 300 C 120 230, 240 290, 380 212 C 520 134, 640 58, 840 36 L 840 62 C 650 92, 540 176, 400 256 C 260 334, 120 284, -40 332 Z",
    edge: "M -40 300 C 120 230, 240 290, 380 212 C 520 134, 640 58, 840 36",
  },
  {
    color: colors.ribbonIce,
    d: "M -40 336 C 140 276, 250 326, 400 246 C 540 166, 660 106, 840 78 L 840 104 C 670 138, 560 218, 420 290 C 270 368, 130 318, -40 364 Z",
    edge: "M -40 336 C 140 276, 250 326, 400 246 C 540 166, 660 106, 840 78",
  },
  {
    color: colors.ribbonGold,
    d: "M -40 372 C 150 320, 280 358, 430 284 C 570 212, 690 150, 840 126 L 840 160 C 700 186, 590 262, 450 330 C 300 404, 140 360, -40 402 Z",
    edge: "M -40 372 C 150 320, 280 358, 430 284 C 570 212, 690 150, 840 126",
  },
]

export default function Ribbons({ style }: { style?: CSSProperties }) {
  const id = useId().replace(/:/g, "")
  return (
    <svg aria-hidden viewBox="0 0 800 420" preserveAspectRatio="xMidYMid slice" style={{ display: "block", width: "100%", height: "100%", ...style }}>
      <defs>
        <filter id={`glow-${id}`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        {RIBBONS.map((ribbon, index) => (
          <linearGradient key={index} id={`ribbon-${id}-${index}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={ribbon.color} stopOpacity="0" />
            <stop offset="0.22" stopColor={ribbon.color} stopOpacity="0.5" />
            <stop offset="0.5" stopColor={colors.ribbonSheen} stopOpacity="0.85" />
            <stop offset="0.62" stopColor={ribbon.color} stopOpacity="0.85" />
            <stop offset="1" stopColor={ribbon.color} stopOpacity="0.15" />
          </linearGradient>
        ))}
      </defs>
      {/* Soft glow behind */}
      <g filter={`url(#glow-${id})`} opacity="0.55">
        {RIBBONS.map((ribbon, index) => (
          <path key={index} d={ribbon.d} fill={ribbon.color} opacity="0.6" />
        ))}
      </g>
      {/* The ribbons, with a bright edge like light on glass */}
      {RIBBONS.map((ribbon, index) => (
        <g key={index}>
          <path d={ribbon.d} fill={`url(#ribbon-${id}-${index})`} />
          <path d={ribbon.edge} fill="none" stroke={colors.ribbonSheen} strokeOpacity="0.55" strokeWidth="1.2" />
        </g>
      ))}
    </svg>
  )
}
