import { useContentTranslator } from "@/i18n/use-content-translator"
import Box, { type BoxProps } from "@mui/material/Box"
import Image from "next/image"
import type { ArticleArtVariant } from "@/content/learn/articles"
import { getLearnIllustration } from "@/content/learn/illustrations"
import { brand } from "@/theme/tokens"

/**
 * Editorial illustrations drawn for VETUD Learn, in the brand's navy and glacier palette.
 * Original artwork, so there are no stock-photo licences to manage. `uid` keeps gradient
 * ids unique when several illustrations share a page.
 */
export default function ArticleArt({ variant, uid, illustrationSlug, sizes = "(max-width: 600px) 90vw, (max-width: 1200px) 45vw, 440px", sx, ...props }: { variant: ArticleArtVariant; uid: string; illustrationSlug?: string; sizes?: string } & BoxProps) {
  const ct = useContentTranslator()
  const illustration = illustrationSlug ? getLearnIllustration(illustrationSlug) : undefined
  if (illustration) return <Box sx={[{ position: "relative", overflow: "hidden", bgcolor: "brand.mintWash" }, ...(Array.isArray(sx) ? sx : [sx])]} {...props}>
    <Image src={illustration.src} alt={ct(illustration.alt)} fill sizes={sizes} style={{ objectFit: "cover" }} />
  </Box>
  const id = (name: string) => `${uid}-${name}`
  const url = (name: string) => `url(#${id(name)})`
  return (
    <Box aria-hidden sx={[{ position: "relative", overflow: "hidden", bgcolor: brand.blue875_3, "& svg": { display: "block", width: "100%", height: "100%" } }, ...(Array.isArray(sx) ? sx : [sx])]} {...props}>
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" role="presentation">
        <defs>
          <radialGradient id={id("sky")} cx="70%" cy="20%" r="95%">
            <stop offset="0" stopColor={brand.blue625} />
            <stop offset=".55" stopColor={brand.blue775} />
            <stop offset="1" stopColor={brand.blue875_4} />
          </radialGradient>
          <radialGradient id={id("glow")} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor={brand.cyan} stopOpacity=".55" />
            <stop offset="1" stopColor={brand.cyan} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={id("amber")} cx="34%" cy="30%" r="72%">
            <stop offset="0" stopColor={brand.amber75_2} />
            <stop offset=".28" stopColor={brand.orange300} />
            <stop offset=".75" stopColor={brand.orange500} />
            <stop offset="1" stopColor={brand.orange700} />
          </radialGradient>
          <radialGradient id={id("ice")} cx="34%" cy="30%" r="72%">
            <stop offset="0" stopColor={brand.white} />
            <stop offset=".35" stopColor={brand.blue150} />
            <stop offset="1" stopColor={brand.blue} />
          </radialGradient>
          <linearGradient id={id("glass")} x1="0" x2="1">
            <stop offset="0" stopColor={brand.white} stopOpacity=".08" />
            <stop offset=".22" stopColor={brand.white} stopOpacity=".38" />
            <stop offset=".5" stopColor={brand.white} stopOpacity=".1" />
            <stop offset="1" stopColor={brand.white} stopOpacity=".24" />
          </linearGradient>
          <linearGradient id={id("skin")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={brand.orange175} />
            <stop offset=".45" stopColor={brand.orange350} />
            <stop offset="1" stopColor={brand.orange675} />
          </linearGradient>
          <radialGradient id={id("peach")} cx="34%" cy="30%" r="72%">
            <stop offset="0" stopColor={brand.orange50} />
            <stop offset=".4" stopColor={brand.orange225} />
            <stop offset="1" stopColor={brand.orange550} />
          </radialGradient>
          <linearGradient id={id("bar")} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor={brand.blue} stopOpacity=".25" />
            <stop offset="1" stopColor={brand.cyan} />
          </linearGradient>
          <filter id={id("blur")} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" /></filter>
          <filter id={id("soft")} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" /></filter>
        </defs>
        <rect width="1600" height="900" fill={url("sky")} />
        <circle cx="1150" cy="260" r="420" fill={url("glow")} />
        {Array.from({ length: 26 }, (_, i) => <circle key={i} cx={(i * 337) % 1600} cy={(i * 191) % 900} r={i % 5 === 0 ? 2.4 : 1.2} fill={brand.blue125} opacity={0.25 + (i % 4) * 0.12} />)}
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
      <circle cx={x + 14} cy={y + 22} r={r} fill={brand.blue950} opacity=".35" filter={url("soft")} />
      <circle cx={x} cy={y} r={r} fill={url("amber")} />
      <ellipse cx={x - r * .32} cy={y - r * .36} rx={r * .28} ry={r * .16} fill={brand.white} opacity=".35" />
    </g>)}
  </g>
}

function Triple({ url }: Paint) {
  return <g style={{ mixBlendMode: "screen" }}>
    {[[700, 380, brand.cyan], [900, 380, brand.blue250], [800, 550, brand.teal400]].map(([x, y, color], i) => <g key={i}>
      <circle cx={x} cy={y} r={210} fill={color as string} opacity=".16" />
      <circle cx={x} cy={y} r={210} fill="none" stroke={color as string} strokeWidth="5" opacity=".9" />
      <circle cx={x} cy={y} r={232} fill="none" stroke={color as string} strokeWidth="2" opacity=".35" filter={url("soft")} />
    </g>)}
    <circle cx="800" cy="440" r="26" fill={brand.white} filter={url("soft")} />
    <circle cx="800" cy="440" r="12" fill={brand.white} />
  </g>
}

function Bars({ url }: Paint) {
  const heights = [180, 260, 330, 420, 470, 560]
  return <g>
    <line x1="320" y1="760" x2="1280" y2="760" stroke={brand.cyan} strokeOpacity=".35" strokeWidth="2" />
    {heights.map((h, i) => <rect key={i} x={360 + i * 150} y={760 - h} width="84" height={h} rx="10" fill={url("bar")} />)}
    <path d={`M${402} ${760 - 200} ${heights.map((h, i) => `L${402 + i * 150} ${740 - h}`).join(" ")}`} fill="none" stroke={brand.white} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity=".9" />
    {heights.map((h, i) => <circle key={i} cx={402 + i * 150} cy={740 - h} r="11" fill={brand.white} stroke={brand.blue775} strokeWidth="4" />)}
  </g>
}

function Pill({ url }: Paint) {
  return <g>
    <ellipse cx="820" cy="660" rx="330" ry="46" fill={brand.blue950} opacity=".45" filter={url("blur")} />
    <g transform="rotate(-18 800 450)">
      <rect x="470" y="330" width="660" height="240" rx="120" fill={url("ice")} />
      <rect x="470" y="330" width="330" height="240" rx="120" fill={brand.white} opacity=".9" />
      <rect x="760" y="330" width="80" height="240" fill={brand.white} opacity=".9" />
      <line x1="800" y1="330" x2="800" y2="570" stroke={brand.blue775} strokeOpacity=".25" strokeWidth="4" />
      <rect x="520" y="360" width="520" height="40" rx="20" fill={brand.white} opacity=".45" />
    </g>
  </g>
}

function Vials({ url }: Paint) {
  return <g>
    {[0, 1, 2, 3, 4].map((i) => {
      const x = 360 + i * 200
      const lit = i === 2
      return <g key={i} opacity={lit ? 1 : .55}>
        <ellipse cx={x + 60} cy="752" rx="80" ry="16" fill={brand.blue950} opacity=".5" filter={url("soft")} />
        <rect x={x} y="380" width="120" height="370" rx="22" fill={url("glass")} stroke={brand.blue125} strokeOpacity=".55" strokeWidth="3" />
        <rect x={x + 8} y="560" width="104" height="182" rx="16" fill={lit ? brand.cyan : brand.blue} opacity={lit ? .85 : .55} />
        <rect x={x + 6} y="320" width="108" height="70" rx="12" fill={lit ? brand.onNavy : brand.onNavyMuted} />
        <rect x={x + 18} y="400" width="16" height="320" rx="8" fill={brand.white} opacity=".35" />
        {lit && <circle cx={x + 60} cy="560" r="160" fill={url("glow")} />}
      </g>
    })}
  </g>
}

function Documents() {
  return <g>
    {[[-10, 520, 250], [6, 600, 230], [-2, 680, 210]].map(([angle, x, y], i) => <g key={i} transform={`rotate(${angle} ${x + 200} ${y + 260})`}>
      <rect x={x} y={y} width="400" height="520" rx="18" fill={brand.onNavy} opacity={0.35 + i * 0.3} />
      {Array.from({ length: 9 }, (_, line) => <rect key={line} x={x + 44} y={y + 70 + line * 44} width={line % 3 === 2 ? 200 : 312} height="12" rx="6" fill={brand.blue775} opacity={0.12 + i * 0.1} />)}
    </g>)}
    <circle cx="1080" cy="660" r="96" fill="none" stroke={brand.cyan} strokeWidth="10" />
    <path d="m1036 662 30 30 60-66" fill="none" stroke={brand.cyan} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
  </g>
}

function Duo({ url }: Paint) {
  const chain = (offset: number, phase: number) => Array.from({ length: 9 }, (_, i) => [300 + i * 125, 450 + Math.sin(i * .8 + phase) * 150 + offset] as const)
  return <g>
    {[[chain(0, 0), "ice"], [chain(0, Math.PI), "amber"]].map(([points, fill], k) => <g key={k}>
      <path d={(points as readonly (readonly [number, number])[]).map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ")} fill="none" stroke={brand.blue125} strokeOpacity=".5" strokeWidth="6" />
      {(points as readonly (readonly [number, number])[]).map(([x, y], i) => <g key={i}>
        <circle cx={x + 6} cy={y + 10} r="36" fill={brand.blue950} opacity=".35" filter={url("soft")} />
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
    <path d={edge} fill="none" stroke={brand.orange75_2} strokeWidth="7" opacity=".9" filter={url("soft")} />
    {Array.from({ length: 16 }, (_, i) => {
      const y = 560 + i * 22
      return <path key={i} d={`M-50 ${y} C 350 ${y - 70}, 700 ${y + 60}, 1000 ${y - 20} S 1450 ${y - 60}, 1650 ${y}`} fill="none" stroke={brand.orange50_2} strokeOpacity={0.16 + (i % 3) * 0.12} strokeWidth={i % 4 === 0 ? 4 : 2} />
    })}
    {[[260, 600, 34], [520, 652, 26], [760, 602, 40], [1020, 682, 30], [1260, 612, 36], [1460, 690, 24]].map(([x, y, r], i) => <g key={i}>
      <circle cx={x + 6} cy={y + 10} r={r} fill={brand.orange875} opacity=".3" filter={url("soft")} />
      <circle cx={x} cy={y} r={r} fill={url("peach")} />
      <ellipse cx={x - r * .3} cy={y - r * .35} rx={r * .3} ry={r * .18} fill={brand.white} opacity=".45" />
    </g>)}
  </g>
}
