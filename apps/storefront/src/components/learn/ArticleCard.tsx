import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { formatArticleDate, type Article } from "@/content/learn/articles"
import { AppLink } from "../common/links"
import ArticleArt from "./ArticleArt"

/** The headline with its key phrase highlighted, as on a magazine cover. */
export function ArticleHeadline({ headline, highlight = "brand.cyan" }: { headline: Article["headline"]; highlight?: string }) {
  const [before, key, after] = headline
  return <>{before}<Box component="span" sx={{ color: highlight }}>{key}</Box>{after}</>
}

export default function ArticleCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  return (
    <Box component="article" sx={{ position: "relative", display: "flex", flexDirection: "column", height: "100%", "&:hover .article-art": { transform: "scale(1.03)" }, "&:focus-within": { outline: "2px solid", outlineColor: "brand.blue", outlineOffset: 5 } }}>
      <Box sx={{ position: "relative", borderRadius: "6px", overflow: "hidden", aspectRatio: featured ? { xs: "4 / 3", md: "16 / 9" } : "16 / 10" }}>
        <ArticleArt className="article-art" variant={article.art} uid={`card-${article.slug}`} sx={{ position: "absolute", inset: 0, transition: "transform .5s ease", "@media (prefers-reduced-motion: reduce)": { transition: "none" } }} />
        {featured ? (
          <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", p: { xs: 2.5, md: 4 }, background: "linear-gradient(0deg, rgba(5,9,26,.9), rgba(5,9,26,.25) 55%, transparent)" }}>
            <Typography component="p" aria-hidden sx={{ color: "#fff", fontWeight: 700, fontSize: { xs: 24, md: 38 }, lineHeight: 1.12, letterSpacing: "-.03em", maxWidth: 820, textWrap: "balance" }}>
              <ArticleHeadline headline={article.headline} />
            </Typography>
          </Box>
        ) : null}
      </Box>
      <Box sx={{ pt: 2.25, display: "flex", flexDirection: "column", flex: 1 }}>
        <Typography sx={{ fontSize: 12, color: "text.secondary", display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Box component="span" sx={{ color: "brand.blue", fontWeight: 650 }}>{article.kind}</Box>
          <span>{article.topic}</span>
          <Box component="time" dateTime={article.date}>{formatArticleDate(article.date)}</Box>
        </Typography>
        <Typography component="h3" sx={{ mt: 1, fontSize: featured ? { xs: 20, md: 24 } : 19, fontWeight: 600, lineHeight: 1.3, letterSpacing: "-.02em", textWrap: "balance" }}>
          <AppLink href={`/news/${article.slug}`} underline="none" sx={{ color: "text.primary", fontWeight: "inherit", "&::after": { content: '""', position: "absolute", inset: 0 }, "&:focus-visible": { outline: "none" } }}>
            {article.headline.join("")}
          </AppLink>
        </Typography>
        <Typography sx={{ mt: 1, color: "text.secondary", fontSize: 14.5, lineHeight: 1.7 }}>{article.dek}</Typography>
      </Box>
    </Box>
  )
}
