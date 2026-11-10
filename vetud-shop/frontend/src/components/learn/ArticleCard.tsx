import { useContentTranslator } from "@/i18n/use-content-translator"
import { useTranslations } from "next-intl"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { formatArticleDate, type Article } from "@/content/learn/articles"
import { AppLink } from "../common/links"
import ArticleArt from "./ArticleArt"

/** The headline with its key phrase highlighted, as on a magazine cover. */
export function ArticleHeadline({ headline, highlight = "brand.cyan" }: { headline: Article["headline"]; highlight?: string }) {
  const ct = useContentTranslator()
  const [before, key, after] = headline
  const translated = ct(`${before}<highlight>${key}</highlight>${after ?? ""}`)
  const [prefix, rest = ""] = translated.split("<highlight>")
  const [emphasis, suffix] = rest.split("</highlight>")
  return <>{prefix}<Box component="span" sx={{ color: highlight }}>{emphasis}</Box>{suffix}</>
}

/**
 * The artwork is shown whole at 16:9, the ratio it is drawn at, so its built-in labels are never
 * cropped. The featured card sets the image beside a larger headline from tablet width up.
 */
export default function ArticleCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  return (
    <Box component="article" sx={{ position: "relative", height: "100%", display: featured ? { xs: "flex", md: "grid" } : "flex", flexDirection: "column", gridTemplateColumns: { md: "minmax(0, 1.4fr) minmax(0, 1fr)" }, columnGap: { md: 5 }, alignItems: { md: featured ? "center" : undefined }, "&:hover .article-art": { transform: "scale(1.03)" }, "&:focus-within": { outline: "2px solid", outlineColor: "brand.blue", outlineOffset: 5 } }}>
      <Box sx={{ position: "relative", borderRadius: featured ? "14px" : "8px", overflow: "hidden", aspectRatio: "16 / 9", border: "1px solid", borderColor: "divider", boxShadow: featured ? "0 24px 50px -32px rgba(21,38,94,.45)" : "none" }}>
        <ArticleArt className="article-art" variant={article.art} illustrationSlug={article.slug} uid={`card-${article.slug}`} sizes={featured ? "(max-width: 900px) 100vw, 760px" : undefined} sx={{ position: "absolute", inset: 0, transition: "transform .5s ease", "@media (prefers-reduced-motion: reduce)": { transition: "none" } }} />
      </Box>
      <Box sx={{ pt: featured ? { xs: 2.5, md: 0 } : 2.25, display: "flex", flexDirection: "column", flex: 1 }}>
        <Typography sx={{ fontSize: featured ? 13 : 12, color: "text.secondary", display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Box component="span" sx={{ color: "brand.blue", fontWeight: 650 }}>{ct(article.kind)}</Box>
          <span>{ct(article.topic)}</span>
          <Box component="time" dateTime={article.date}>{ct(formatArticleDate(article.date, ct.locale))}</Box>
        </Typography>
        <Typography component={featured ? "h2" : "h3"} sx={{ mt: featured ? 1.5 : 1, fontSize: featured ? { xs: 26, md: 34 } : 19, fontWeight: featured ? 700 : 600, lineHeight: featured ? 1.15 : 1.3, letterSpacing: featured ? "-.035em" : "-.02em", textWrap: "balance", color: "brand.navy" }}>
          <AppLink href={`/news/${article.slug}`} underline="none" sx={{ color: "inherit", fontWeight: "inherit", "&::after": { content: '""', position: "absolute", inset: 0 }, "&:focus-visible": { outline: "none" } }}>
            {ct(article.headline.join(""))}
          </AppLink>
        </Typography>
        <Typography sx={{ mt: featured ? 1.75 : 1, color: "text.secondary", fontSize: featured ? { xs: 16, md: 17 } : 14.5, lineHeight: 1.7 }}>{ct(article.dek)}</Typography>
        {featured ? <Typography aria-hidden sx={{ mt: 2.5, fontSize: 15, fontWeight: 700, color: "brand.blue" }}>{act("readArticle")}</Typography> : null}
      </Box>
    </Box>
  )
}
