import { useId } from "react"
import type { ArtKind } from "@/lib/product"

type ProductArtProps = {
  code: string
  accent: string
  kind?: ArtKind
  label?: string
  /** Accessible description; omit when the art is decorative next to the product name. */
  title?: string
}

function tint(hex: string, amount: number) {
  const value = parseInt(hex.slice(1), 16)
  return `rgb(${[(value >> 16) & 255, (value >> 8) & 255, value & 255]
    .map((channel) => Math.round(channel + (255 - channel) * amount))
    .join(",")})`
}

function AlpineMark({ x, y, color, scale = 1 }: { x: number; y: number; color: string; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 4.5 9 15.5 9-15.5" />
      <path d="m5.5 14.5 5-8.5 4.5 7.5 3.5-6" strokeWidth="1" />
      <circle cx="3" cy="4.5" r="1.5" fill={color} stroke="none" />
      <circle cx="10.5" cy="6" r="1.3" fill={color} stroke="none" />
      <circle cx="21" cy="4.5" r="1.5" fill={color} stroke="none" />
    </g>
  )
}

function AlpinePrint({ color }: { color: string }) {
  return (
    <g>
      <path d="M0 170 22 149l14 9 25-40 21 29 24-9v70H0Z" fill={tint(color, 0.88)} />
      <path d="m0 193 29-25 16 11 22-28 21 26 18-10v41H0Z" fill={tint(color, 0.73)} opacity=".6" />
      <g fill="none" stroke={color} strokeWidth=".65" opacity=".65">
        <path d="m0 170 22-21 14 9 25-40 21 29 24-9M46 142l15-24 21 29M61 118l-2 26 9-8 14 11" />
        <path d="m0 193 29-25 16 11 22-28 21 26 18-10M29 168l4 15 12-4M67 151l-4 19 9-8 16 15" />
        <path d="M0 205c28-13 49-3 65-8s22-9 41-6M0 199c21-9 47-2 64-6s27-9 42-8" opacity=".5" />
      </g>
    </g>
  )
}

function ResearchVial({ x, y, accent, id, code, scale = 1, supply = false }: {
  x: number; y: number; accent: string; id: string; code: string; scale?: number; supply?: boolean
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="37" cy="173" rx="37" ry="7" fill="#254257" opacity=".06" />
      <path d="M15 27h44v13c0 9 11 14 11 25v93c0 10-8 15-33 15S4 168 4 158V65c0-11 11-16 11-25Z" fill={`url(#${id}-${supply ? "glass" : "silver"})`} stroke="#bcc9cd" strokeWidth=".65" />
      <path d="M12 65v85c0 7 2 12 6 14" fill="none" stroke="#fff" strokeWidth="4" opacity=".55" />
      {supply ? <path d="M5 140h64v18c0 10-8 15-32 15S5 168 5 158Z" fill={tint(accent, 0.62)} opacity=".34" /> : null}
      <rect x="12" y="0" width="50" height="29" rx="4" fill={`url(#${id}-cap)`} stroke="#c5d1d4" strokeWidth=".6" />
      <g stroke="#7e939d" strokeWidth=".7" opacity=".32">
        {[17, 22, 27, 32, 37, 42, 47, 52, 57].map((line) => <path key={line} d={`M${line} 4v20`} />)}
      </g>
      <rect x="10" y="27" width="54" height="6" rx="2" fill={`url(#${id}-silver)`} stroke="#aabac1" strokeWidth=".6" />
      <rect x="5" y="64" width="64" height="82" rx="1" fill={`url(#${id}-label)`} />
      <AlpineMark x={28} y={74} color={accent} scale={0.68} />
      <text x="37" y="106" textAnchor="middle" fontFamily="var(--font-manrope), sans-serif" fontWeight="700" fontSize="9.7" letterSpacing="2.1" fill="#12334c">VETUD</text>
      <text x="37" y="118" textAnchor="middle" fontFamily="var(--font-dm-mono), monospace" fontSize="5.7" letterSpacing=".7" fill={accent}>{code}</text>
      <path d="M27 126h20" stroke={accent} strokeWidth=".65" opacity=".7" />
      <text x="37" y="135" textAnchor="middle" fontFamily="var(--font-manrope), sans-serif" fontSize="4.5" letterSpacing=".65" fill="#506875">RESEARCH USE ONLY</text>
      <path d="M5 145h64v9c-22 4-43 4-64 0Z" fill={tint(accent, 0.77)} />
      <g fill="none" stroke={accent} strokeWidth=".7" opacity=".65">
        <path d="m5 151 13-7 8 4 15-11 14 12 14-5M35 143l6-6 8 8M41 137l-2 9 5-4" />
      </g>
      <path d="M17 164c11 3 27 3 40 0" fill="none" stroke="#fff" strokeWidth="1" opacity=".85" />
    </g>
  )
}

/** Upright alpine packaging and laboratory vials, with a distinct material finish per range. */
export default function ProductArt({ code, accent, kind = "series", label, title }: ProductArtProps) {
  const instance = useId().replace(/[^a-z0-9]/gi, "")
  const id = `vetud-art-${instance}`
  const series = label ?? (kind === "supply" ? "LAB ESSENTIALS" : kind === "blend" ? "BLEND COLLECTION" : "PEPTIDE COLLECTION")

  return (
    <svg viewBox="0 0 340 300" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}
      style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}>
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={`${id}-box`} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#f0f4f4" /><stop offset=".12" stopColor="#fff" /><stop offset=".8" stopColor="#fbfcfc" /><stop offset="1" stopColor="#e8eff0" />
        </linearGradient>
        <linearGradient id={`${id}-side`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#e7edef" /><stop offset="1" stopColor="#cbd9de" />
        </linearGradient>
        <linearGradient id={`${id}-silver`} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#a9b7c0" /><stop offset=".13" stopColor="#eaf0f2" /><stop offset=".3" stopColor="#fff" /><stop offset=".54" stopColor="#dbe3e7" /><stop offset=".82" stopColor="#c0ccd3" /><stop offset="1" stopColor="#8d9ea8" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#c5d6dc" stopOpacity=".85" /><stop offset=".2" stopColor="#fff" stopOpacity=".8" /><stop offset=".65" stopColor="#e2edf0" stopOpacity=".68" /><stop offset="1" stopColor="#a8c3cd" stopOpacity=".8" />
        </linearGradient>
        <linearGradient id={`${id}-cap`} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#c5d0d5" /><stop offset=".24" stopColor="#fff" /><stop offset=".5" stopColor="#edf1f2" /><stop offset="1" stopColor="#b5c3ca" />
        </linearGradient>
        <linearGradient id={`${id}-label`} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#e9eff1" /><stop offset=".25" stopColor="#fff" /><stop offset=".75" stopColor="#fbfcfc" /><stop offset="1" stopColor="#e8eff1" />
        </linearGradient>
        <filter id={`${id}-shadow`} x="-25%" y="-15%" width="160%" height="145%">
          <feDropShadow dx="5" dy="9" stdDeviation="7" floodColor="#12334c" floodOpacity=".1" />
        </filter>
      </defs>

      <ellipse cx="179" cy="277" rx="115" ry="9" fill="#345364" opacity=".045" />
      <g filter={`url(#${id}-shadow)`}>
        <path d="m83 55 18-9h105l-18 9Z" fill="#fcfdfd" stroke="#d5dfe3" strokeWidth=".65" />
        <path d="m188 55 18-9v208l-18 9Z" fill={`url(#${id}-side)`} stroke="#c8d5db" strokeWidth=".65" />
        <rect x="83" y="55" width="105" height="208" rx="1" fill={`url(#${id}-box)`} stroke="#d2dee2" strokeWidth=".7" />
        <g transform="translate(83 55)">
          <AlpinePrint color={accent} />
          <AlpineMark x={42} y={20} color={accent} scale={0.85} />
          <text x="53" y="65" textAnchor="middle" fontFamily="var(--font-manrope), sans-serif" fontWeight="650" fontSize="13.4" letterSpacing="3" fill="#12334c">VETUD</text>
          <text x="53" y="79" textAnchor="middle" fontFamily="var(--font-manrope), sans-serif" fontSize="5.4" letterSpacing="1.2" fill="#617784">{series}</text>
          <path d="M42 91h22" stroke={accent} strokeWidth=".7" />
          <text x="53" y="107" textAnchor="middle" fontFamily="var(--font-dm-mono), monospace" fontSize="7.4" letterSpacing="1" fill={accent}>{code}</text>
          <text x="53" y="197" textAnchor="middle" fontFamily="var(--font-manrope), sans-serif" fontSize="4.8" letterSpacing=".75" fill="#365566">FOR LABORATORY RESEARCH</text>
        </g>
        <path d="M86 59v198" stroke="#fff" strokeWidth="1.5" opacity=".8" />
        <text x="198" y="157" transform="rotate(-90 198 157)" textAnchor="middle" fontFamily="var(--font-manrope), sans-serif" fontSize="4.5" letterSpacing="2.2" fill="#607887">SCIENCE. WITH CLARITY.</text>
      </g>
      <g filter={`url(#${id}-shadow)`}>
        {kind === "blend" ? (
          <>
            <ResearchVial x={167} y={118} accent={accent} id={id} code={code} scale={0.83} />
            <ResearchVial x={216} y={110} accent={accent} id={id} code={code} scale={0.92} />
          </>
        ) : (
          <ResearchVial x={186} y={94} accent={accent} id={id} code={code} scale={1.03} supply={kind === "supply"} />
        )}
      </g>
    </svg>
  )
}
