import type { ArtKind } from "@/lib/product"

type ProductArtProps = {
  code: string
  accent: string
  kind?: ArtKind
  label?: string
  /** Accessible description; omit when the art is decorative next to the product name. */
  title?: string
}

/** Mixes a hex colour with white. amount=0 keeps the colour, 1 returns white. */
function tint(hex: string, amount: number) {
  const value = parseInt(hex.slice(1), 16)
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) =>
    Math.round(channel + (255 - channel) * amount)
  )
  return `rgb(${channels.join(",")})`
}

function shade(hex: string, amount: number) {
  const value = parseInt(hex.slice(1), 16)
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) =>
    Math.round(channel * (1 - amount))
  )
  return `rgb(${channels.join(",")})`
}

function Vial({ x, y, accent, idPrefix }: { x: number; y: number; accent: string; idPrefix: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y="16" width="34" height="62" rx="7" fill={`url(#${idPrefix}-glass)`} stroke="#9fbdb5" />
      <rect x="2" y="44" width="30" height="32" rx="6" fill={tint(accent, 0.35)} opacity="0.9" />
      <rect x="5" y="0" width="24" height="18" rx="3" fill={shade(accent, 0.25)} />
      <rect x="3" y="14" width="28" height="6" rx="2" fill="#dfeae5" stroke="#b5ccc4" />
      <rect x="6" y="50" width="22" height="14" rx="2" fill="#fff" opacity="0.85" />
      <rect x="9" y="54" width="16" height="2" rx="1" fill={shade(accent, 0.3)} />
      <rect x="9" y="58" width="10" height="2" rx="1" fill="#9fbdb5" />
      <rect x="6" y="22" width="4" height="40" rx="2" fill="#fff" opacity="0.7" />
    </g>
  )
}

function Bottle({ x, y, accent, idPrefix }: { x: number; y: number; accent: string; idPrefix: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="8" y="0" width="30" height="12" rx="3" fill={shade(accent, 0.25)} />
      <path d="M10 12h26v8l8 10v52a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6V30l8-10z" fill={`url(#${idPrefix}-glass)`} stroke="#9fbdb5" />
      <rect x="6" y="46" width="34" height="26" rx="2" fill="#fff" opacity="0.88" />
      <rect x="10" y="52" width="22" height="2.5" rx="1" fill={shade(accent, 0.3)} />
      <rect x="10" y="58" width="14" height="2.5" rx="1" fill="#9fbdb5" />
      <rect x="8" y="32" width="4" height="40" rx="2" fill="#fff" opacity="0.7" />
    </g>
  )
}

/**
 * The Vetud kit box from the concept, drawn as SVG and tinted per product via `accent`.
 * Peptides show a single vial, blends two, supplies a bottle.
 */
export default function ProductArt({ code, accent, kind = "series", label, title }: ProductArtProps) {
  const idPrefix = `art-${code.replace(/[^a-z0-9]/gi, "")}-${kind}`
  const series = label ?? (kind === "supply" ? "LAB SUPPLY" : kind === "blend" ? "BLEND SERIES" : "PEPTIDE SERIES")

  return (
    <svg
      viewBox="0 0 340 214"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`${idPrefix}-box`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.42" stopColor={tint(accent, 0.94)} />
          <stop offset="1" stopColor={tint(accent, 0.78)} />
        </linearGradient>
        <linearGradient id={`${idPrefix}-ribbon`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={accent} />
          <stop offset="0.55" stopColor={tint(accent, 0.75)} />
          <stop offset="1" stopColor={accent} />
        </linearGradient>
        <linearGradient id={`${idPrefix}-window`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tint(accent, 0.9)} />
          <stop offset="1" stopColor={tint(accent, 0.72)} />
        </linearGradient>
        <linearGradient id={`${idPrefix}-glass`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#eef5f1" />
          <stop offset="1" stopColor="#cfe0d9" />
        </linearGradient>
        <filter id={`${idPrefix}-shadow`} x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="14" stdDeviation="12" floodColor="#0b3a44" floodOpacity="0.2" />
        </filter>
      </defs>

      {title ? <title>{title}</title> : null}

      <g filter={`url(#${idPrefix}-shadow)`}>
        {/* side edge for depth */}
        <path d="M322 14 334 6v192l-12 8z" fill={tint(accent, 0.7)} stroke="#c7ddd5" />
        <path d="M18 14 30 6h304l-12 8z" fill={tint(accent, 0.86)} stroke="#d6e6e0" />
        <rect x="18" y="14" width="304" height="192" rx="4" fill={`url(#${idPrefix}-box)`} stroke="#b7d1c8" />
      </g>
      <rect x="18" y="14" width="304" height="5" rx="2" fill={`url(#${idPrefix}-ribbon)`} />
      <rect x="23" y="19" width="294" height="182" rx="3" fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="4" />

      <text x="36" y="46" fontFamily="var(--font-manrope), Arial, sans-serif" fontWeight="800" fontSize="15" letterSpacing="1.4" fill="#174d63">
        VETUD
      </text>
      <text x="36" y="64" fontFamily="var(--font-manrope), Arial, sans-serif" fontWeight="700" fontSize="10.5" letterSpacing="1.2" fill="#2c6377">
        {series}
      </text>
      <text x="36" y="86" fontFamily="var(--font-dm-mono), monospace" fontSize="8" letterSpacing="1" fill="#5f8a88">
        {code}
      </text>

      {/* sequence linework */}
      <g fill="none" stroke={shade(accent, 0.2)} strokeWidth="0.9" opacity="0.6">
        <path d="M30 150c34-38 56-38 91-6s57 17 99-30" />
        <path d="M30 156c32-32 58-35 91-7s58 16 99-26" />
        <path d="m69 132 8-5 8 5v9l-8 5-8-5zM121 140l7-4 7 4v8l-7 4-7-4z" />
      </g>
      <g fill={accent}>
        <circle cx="77" cy="132" r="1.8" />
        <circle cx="128" cy="140" r="1.8" />
      </g>

      {/* lot seal */}
      <circle cx="170" cy="178" r="16" fill={tint(accent, 0.85)} stroke={tint(accent, 0.45)} />
      <text x="170" y="176" textAnchor="middle" fontFamily="var(--font-dm-mono), monospace" fontSize="6" letterSpacing="0.6" fill={shade(accent, 0.35)}>
        LOT
      </text>
      <text x="170" y="184" textAnchor="middle" fontFamily="var(--font-dm-mono), monospace" fontSize="6" letterSpacing="0.6" fill={shade(accent, 0.35)}>
        TRACE
      </text>
      <text x="36" y="190" fontFamily="var(--font-dm-mono), monospace" fontSize="6.5" letterSpacing="0.9" fill="#5f8a88">
        RESEARCH USE ONLY
      </text>

      {/* product window */}
      <rect x="204" y="40" width="102" height="140" rx="3" fill={`url(#${idPrefix}-window)`} stroke="#9fbdb5" />
      <rect x="208" y="44" width="94" height="132" rx="2" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="4" />
      {kind === "blend" ? (
        <>
          <Vial x={220} y={66} accent={accent} idPrefix={idPrefix} />
          <Vial x={258} y={74} accent={shade(accent, 0.15)} idPrefix={idPrefix} />
        </>
      ) : kind === "supply" ? (
        <Bottle x={232} y={62} accent={accent} idPrefix={idPrefix} />
      ) : (
        <Vial x={238} y={68} accent={accent} idPrefix={idPrefix} />
      )}
    </svg>
  )
}
