import { useContentTranslator } from "@/i18n/use-content-translator"
import { useTranslations } from "next-intl"
import { translateAction } from "@/i18n/actions"
import Box from "@mui/material/Box"
import Breadcrumbs from "@mui/material/Breadcrumbs"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import type { ReactNode } from "react"
import { AppLink } from "@/components/common/links"
import ArticleArt from "./ArticleArt"
import TableOfContents, { type ContentsItem } from "./TableOfContents"
import type { ArticleArtVariant } from "@/content/learn/articles"
import type { LearnIllustration } from "@/content/learn/illustrations"
import { brand, gutter } from "@/theme/tokens"

/** Shared by the header and the body grid, so the title, artwork and contents rail line up. */
const READING_WIDTH = 1080

export const readingProse = {
  fontSize: { xs: 17, md: 18 }, lineHeight: 1.8, color: "brand.navySoft",
  overflowWrap: "break-word", "& a": { textDecoration: "underline", textUnderlineOffset: "3px" },
} as const

export function ReadingHeader({ title, description, breadcrumbs, image, variant = "triple", uid, minutes, meta, children }: {
  title: string; description: string; breadcrumbs: { label: string; href?: string }[]
  image?: LearnIllustration; variant?: ArticleArtVariant; uid: string; minutes: number; meta?: ReactNode; children?: ReactNode
}) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const dot = <Box component="span" aria-hidden sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: "brand.lineStrong" }} />
  return <Box component="header">
    <Box sx={{ px: gutter, pt: { xs: 3, md: 5 }, pb: { xs: 3.5, md: 5 }, bgcolor: "brand.paper" }}>
      <Box sx={{ maxWidth: READING_WIDTH, mx: "auto" }}>
        <Breadcrumbs aria-label={act("breadcrumb")} sx={{ fontSize: 13, mb: { xs: 2.5, md: 4 }, "& a": { minHeight: 32, display: "inline-flex", alignItems: "center" } }}>
          {breadcrumbs.map(item => item.href ? <AppLink key={item.label} href={item.href}>{ct(translateAction(act, item.label))}</AppLink> : <Typography key={item.label} component="span" sx={{ fontSize: "inherit", color: "brand.navySoft" }} aria-current="page">{ct(translateAction(act, item.label))}</Typography>)}
        </Breadcrumbs>
        <Box sx={{ maxWidth: 880 }}>
          {meta ? <Box sx={{ mb: { xs: 2, md: 2.5 }, display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", fontSize: 13.5, color: "brand.navySoft" }}>{ct(meta)}</Box> : null}
          <Typography id="article-title" component="h1" sx={{ fontSize: { xs: 34, sm: 46, md: 56 }, lineHeight: { xs: 1.12, md: 1.06 }, fontWeight: 700, letterSpacing: "-.045em", textWrap: "balance", overflowWrap: "break-word", color: "brand.navy" }}>{ct(title)}</Typography>
          <Typography sx={{ mt: { xs: 2, md: 3 }, fontSize: { xs: 18, md: 21 }, lineHeight: 1.6, color: "brand.navySoft", maxWidth: "62ch", textWrap: "pretty" }}>{ct(description)}</Typography>
          {children}
          <Box sx={{ mt: { xs: 2.5, md: 3.5 }, display: "flex", flexWrap: "wrap", columnGap: 1.5, rowGap: .5, fontSize: 14, color: "brand.navySoft", alignItems: "center" }}>
            <AppLink href="/learn" sx={{ fontSize: "inherit", color: "brand.navy", minHeight: 32, display: "inline-flex", alignItems: "center", fontWeight: 700 }}>{act("byLearn")}</AppLink>
            {ct(dot)}<span>{ct.icu("{minutes, plural, one {# minute of reading} other {# minutes of reading}}", { minutes })}</span>
            {ct(dot)}<AppLink href="#sources" sx={{ fontSize: "inherit", minHeight: 32, display: "inline-flex", alignItems: "center" }}>{act("viewSources")}</AppLink>
          </Box>
        </Box>
      </Box>
    </Box>
    {/* The artwork spans the reading width and straddles the edge between header and body. */}
    <Box sx={{ px: gutter, background: `linear-gradient(to bottom, ${brand.paper} 50%, #fff 50%)` }}>
      <Box component="figure" sx={{ m: 0, maxWidth: READING_WIDTH, mx: { xs: -2.5, sm: "auto" } }}>
        <Box sx={{ position: "relative", aspectRatio: "16 / 9", overflow: "hidden", bgcolor: "brand.mintWash", borderRadius: { xs: 0, sm: "16px" }, border: { xs: 0, sm: "1px solid" }, borderColor: { sm: "divider" }, boxShadow: { sm: "0 28px 60px -34px rgba(21,38,94,.45)" } }}>
          {image ? <Image src={image.src} alt={ct(image.alt)} fill preload sizes={`(max-width: 600px) 100vw, (max-width: 1240px) 92vw, ${READING_WIDTH}px`} style={{ objectFit: "cover" }} />
            : <ArticleArt variant={variant} uid={uid} sx={{ position: "absolute", inset: 0 }} />}
        </Box>
      </Box>
    </Box>
  </Box>
}

export function ReadingLayout({ items, children }: { items: ContentsItem[]; children: ReactNode }) {
  return <Box sx={{ px: gutter, py: { xs: 4, md: 6 }, bgcolor: "background.paper" }}>
    <Box sx={{ maxWidth: READING_WIDTH, mx: "auto", display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "210px minmax(0, 740px)" }, gap: { xs: 3, lg: 8 }, alignItems: "start" }}>
      <TableOfContents items={items} />
      <Box sx={{ minWidth: 0, maxWidth: 740, width: "100%", mx: "auto" }}>{children}</Box>
    </Box>
  </Box>
}

export function ReadingSection({ id, title, children, first = false }: { id: string; title: string; children: ReactNode; first?: boolean }) {
  const ct = useContentTranslator()
  return <Box component="section" id={id} aria-labelledby={`${id}-title`} sx={{ scrollMarginTop: 8, ...(first ? {} : { mt: { xs: 4.5, md: 6 }, pt: { xs: 4, md: 5 }, borderTop: "1px solid", borderColor: "divider" }) }}>
    <Typography id={`${id}-title`} component="h2" sx={{ fontSize: { xs: 24, md: 28 }, fontWeight: 650, lineHeight: 1.3, letterSpacing: "-.025em", color: "brand.navy", mb: 2 }}>{ct(title)}</Typography>
    {children}
  </Box>
}

export function ArticleJsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
}
