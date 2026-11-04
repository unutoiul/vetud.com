import Box, { type BoxProps } from "@mui/material/Box"
import Image from "next/image"
import { getLearnIllustration } from "@/content/learn/illustrations"
import type { ArticleArtVariant } from "@/content/learn/articles"

/**
 * Editorial illustrations drawn for VETUD Learn, in the brand's navy and glacier palette.
 * Original artwork, so there are no stock-photo licences to manage. `uid` keeps gradient
 * ids unique when several illustrations share a page.
 */
export default function ArticleArt({ variant, uid, imageKey, preload = false, sx, ...props }: { variant: ArticleArtVariant; uid: string; imageKey?: string; preload?: boolean } & BoxProps) {
  const illustration = imageKey ? getLearnIllustration(imageKey) : undefined
  if (illustration) return (
    <Box sx={[{ position: "relative", overflow: "hidden", bgcolor: "#f7f9fc" }, ...(Array.isArray(sx) ? sx : [sx])]} {...props}>
      <Image src={illustration.src} alt={illustration.alt} fill preload={preload} sizes="(max-width: 900px) 100vw, 1360px" style={{ objectFit: "contain" }} />
    </Box>
  )
  const id = (name: string) => `${uid}-${name}`
  const url = (name: string) => `url(#${id(name)})`
  return (
    <Box aria-hidden sx={[{ position: "relative", overflow: "hidden", bgcolor: "#0d1838", "& svg": { display: "block", width: "100%", height: "100%" } }, ...(Array.isArray(sx) ? sx : [sx])]} {...props}>
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" role="presentation">
        <defs>
          <radialGradient id={id("sky")} cx="70%" cy="20%" r="95%">
            <stop offset="0" stopColor="#2a4c94" />
            <stop offset=".55" stopColor="#14275c" />
            <stop offset="1" stopColor="#0a1430" />
          </radialGradient>
          <radialGradient id={id("glow")} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#8fc6dd" stopOpacity=".55" />
            <stop offset="1" stopColor="#8fc6dd" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={id("amber")} cx="34%" cy="30%" r="72%">
            <stop offset="0" stopColor="#fff4d8" />
            <stop offset=".28" stopColor="#f6c56b" />
            <stop offset=".75" stopColor="#d48a2a" />
            <stop offset="1" stopColor="#8a4f12" />
          </radialGradient>
          <radialGradient id={id("ice")} cx="34%" cy="30%" r="72%">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset=".35" stopColor="#bfe0f0" />
            <stop offset="1" stopColor="#3268aa" />
          </radialGradient>
          <linearGradient id={id("glass")} x1="0" x2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity=".08" />
            <stop offset=".22" stopColor="#ffffff" stopOpacity=".38" />
            <stop offset=".5" stopColor="#ffffff" stopOpacity=".1" />
            <stop offset="1" stopColor="#ffffff" stopOpacity=".24" />
          </linearGradient>
          <linearGradient id={id("skin")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f6cfb3" />
            <stop offset=".45" stopColor="#d9946f" />
            <stop offset="1" stopColor="#7d4128" />
          </linearGradient>
          <radialGradient id={id("peach")} cx="34%" cy="30%" r="72%">
            <stop offset="0" stopColor="#fff1e6" />
            <stop offset=".4" stopColor="#f3b892" />
            <stop offset="1" stopColor="#a7603e" />
          </radialGradient>
          <linearGradient id={id("bar")} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#3268aa" stopOpacity=".25" />
            <stop offset="1" stopColor="#8fc6dd" />
          </linearGradient>
          <filter id={id("blur")} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" /></filter>
          <filter id={id("soft")} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" /></filter>
        </defs>
        <rect width="1600" height="900" fill={url("sky")} />
        <circle cx="1150" cy="260" r="420" fill={url("glow")} />
        {Array.from({ length: 26 }, (_, i) => <circle key={i} cx={(i * 337) % 1600} cy={(i * 191) % 900} r={i % 5 === 0 ? 2.4 : 1.2} fill="#cfe6f3" opacity={0.25 + (i % 4) * 0.12} />)}
        {variant === "cells" && <Cells url={url} />}
        {variant === "triple" && <Triple url={url} />}
        {variant === "bars" && <Bars url={url} />}
        {variant === "pill" && <Pill url={url} />}
        {variant === "vials" && <Vials url={url} />}
        {variant === "documents" && <Documents />}
        {variant === "duo" && <Duo url={url} />}
        {variant === "skin" && <Skin url={url} />}
      </svg>
    </Box>
  )
}

type Paint = { url: (name: string) => string }

function Cells({ url }: Paint) {
  const back = [[280, 250, 70], [1420, 690, 90], [1460, 170, 54], [180, 700, 60]]
  const cluster = [[820, 420, 120], [690, 360, 104], [950, 330, 110], [760, 560, 112], [910, 560, 118], [610, 500, 96], [1060, 470, 102], [840, 250, 92], [1010, 640, 86], [690, 680, 80]]
  return <g>
    {back.map(([x, y, r], i) => <circle key={`b${i}`} cx={x} cy={y} r={r} fill={url("amber")} filter={url("blur")} opacity=".55" />)}
    {cluster.sort((a, b) => a[1] - b[1]).map(([x, y, r], i) => <g key={i}>
      <circle cx={x + 14} cy={y + 22} r={r} fill="#05091a" opacity=".35" filter={url("soft")} />
      <circle cx={x} cy={y} r={r} fill={url("amber")} />
      <ellipse cx={x - r * .32} cy={y - r * .36} rx={r * .28} ry={r * .16} fill="#fff" opacity=".35" />
    </g>)}
  </g>
}

function Triple({ url }: Paint) {
  return <g style={{ mixBlendMode: "screen" }}>
    {[[700, 380, "#8fc6dd"], [900, 380, "#7f9bff"], [800, 550, "#5fd4c4"]].map(([x, y, color], i) => <g key={i}>
      <circle cx={x} cy={y} r={210} fill={color as string} opacity=".16" />
      <circle cx={x} cy={y} r={210} fill="none" stroke={color as string} strokeWidth="5" opacity=".9" />
      <circle cx={x} cy={y} r={232} fill="none" stroke={color as string} strokeWidth="2" opacity=".35" filter={url("soft")} />
    </g>)}
    <circle cx="800" cy="440" r="26" fill="#fff" filter={url("soft")} />
    <circle cx="800" cy="440" r="12" fill="#fff" />
  </g>
}

function Bars({ url }: Paint) {
  const heights = [180, 260, 330, 420, 470, 560]
  return <g>
    <line x1="320" y1="760" x2="1280" y2="760" stroke="#8fc6dd" strokeOpacity=".35" strokeWidth="2" />
    {heights.map((h, i) => <rect key={i} x={360 + i * 150} y={760 - h} width="84" height={h} rx="10" fill={url("bar")} />)}
    <path d={`M${402} ${760 - 200} ${heights.map((h, i) => `L${402 + i * 150} ${740 - h}`).join(" ")}`} fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity=".9" />
    {heights.map((h, i) => <circle key={i} cx={402 + i * 150} cy={740 - h} r="11" fill="#fff" stroke="#14275c" strokeWidth="4" />)}
  </g>
}

function Pill({ url }: Paint) {
  return <g>
    <ellipse cx="820" cy="660" rx="330" ry="46" fill="#05091a" opacity=".45" filter={url("blur")} />
    <g transform="rotate(-18 800 450)">
      <rect x="470" y="330" width="660" height="240" rx="120" fill={url("ice")} />
      <rect x="470" y="330" width="330" height="240" rx="120" fill="#ffffff" opacity=".9" />
      <rect x="760" y="330" width="80" height="240" fill="#ffffff" opacity=".9" />
      <line x1="800" y1="330" x2="800" y2="570" stroke="#14275c" strokeOpacity=".25" strokeWidth="4" />
      <rect x="520" y="360" width="520" height="40" rx="20" fill="#fff" opacity=".45" />
    </g>
  </g>
}

function Vials({ url }: Paint) {
  return <g>
    {[0, 1, 2, 3, 4].map((i) => {
      const x = 360 + i * 200
      const lit = i === 2
      return <g key={i} opacity={lit ? 1 : .55}>
        <ellipse cx={x + 60} cy="752" rx="80" ry="16" fill="#05091a" opacity=".5" filter={url("soft")} />
        <rect x={x} y="380" width="120" height="370" rx="22" fill={url("glass")} stroke="#cfe6f3" strokeOpacity=".55" strokeWidth="3" />
        <rect x={x + 8} y="560" width="104" height="182" rx="16" fill={lit ? "#8fc6dd" : "#3268aa"} opacity={lit ? .85 : .55} />
        <rect x={x + 6} y="320" width="108" height="70" rx="12" fill={lit ? "#f5f9fb" : "#b4c9d5"} />
        <rect x={x + 18} y="400" width="16" height="320" rx="8" fill="#fff" opacity=".35" />
        {lit && <circle cx={x + 60} cy="560" r="160" fill={url("glow")} />}
      </g>
    })}
  </g>
}

function Documents() {
  return <g>
    {[[-10, 520, 250], [6, 600, 230], [-2, 680, 210]].map(([angle, x, y], i) => <g key={i} transform={`rotate(${angle} ${x + 200} ${y + 260})`}>
      <rect x={x} y={y} width="400" height="520" rx="18" fill="#f5f9fb" opacity={0.35 + i * 0.3} />
      {Array.from({ length: 9 }, (_, line) => <rect key={line} x={x + 44} y={y + 70 + line * 44} width={line % 3 === 2 ? 200 : 312} height="12" rx="6" fill="#14275c" opacity={0.12 + i * 0.1} />)}
    </g>)}
    <circle cx="1080" cy="660" r="96" fill="none" stroke="#8fc6dd" strokeWidth="10" />
    <path d="m1036 662 30 30 60-66" fill="none" stroke="#8fc6dd" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
  </g>
}

function Duo({ url }: Paint) {
  const chain = (offset: number, phase: number) => Array.from({ length: 9 }, (_, i) => [300 + i * 125, 450 + Math.sin(i * .8 + phase) * 150 + offset] as const)
  return <g>
    {[[chain(0, 0), "ice"], [chain(0, Math.PI), "amber"]].map(([points, fill], k) => <g key={k}>
      <path d={(points as readonly (readonly [number, number])[]).map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ")} fill="none" stroke="#cfe6f3" strokeOpacity=".5" strokeWidth="6" />
      {(points as readonly (readonly [number, number])[]).map(([x, y], i) => <g key={i}>
        <circle cx={x + 6} cy={y + 10} r="36" fill="#05091a" opacity=".35" filter={url("soft")} />
        <circle cx={x} cy={y} r="36" fill={url(fill as string)} />
      </g>)}
    </g>)}
  </g>
}

/** A macro cross-section of skin: lit surface, collagen strands glowing beneath, a few cells. */
function Skin({ url }: Paint) {
  const edge = "M-50 520 C 300 430, 600 470, 820 450 S 1350 420, 1650 500"
  return <g>
    <circle cx="1150" cy="260" r="260" fill={url("glow")} />
    <path d={`${edge} V 950 H -50 Z`} fill={url("skin")} />
    <path d={edge} fill="none" stroke="#ffe9d6" strokeWidth="7" opacity=".9" filter={url("soft")} />
    {Array.from({ length: 16 }, (_, i) => {
      const y = 560 + i * 22
      return <path key={i} d={`M-50 ${y} C 350 ${y - 70}, 700 ${y + 60}, 1000 ${y - 20} S 1450 ${y - 60}, 1650 ${y}`} fill="none" stroke="#fff3e8" strokeOpacity={0.16 + (i % 3) * 0.12} strokeWidth={i % 4 === 0 ? 4 : 2} />
    })}
    {[[260, 600, 34], [520, 652, 26], [760, 602, 40], [1020, 682, 30], [1260, 612, 36], [1460, 690, 24]].map(([x, y, r], i) => <g key={i}>
      <circle cx={x + 6} cy={y + 10} r={r} fill="#3a1a0c" opacity=".3" filter={url("soft")} />
      <circle cx={x} cy={y} r={r} fill={url("peach")} />
      <ellipse cx={x - r * .3} cy={y - r * .35} rx={r * .3} ry={r * .18} fill="#fff" opacity=".45" />
    </g>)}
  </g>
}
