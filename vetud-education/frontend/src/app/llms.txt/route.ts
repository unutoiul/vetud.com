import { LEGAL_DOCUMENTS } from "@/content/legal"
import { ARTICLES, LEARNING_GUIDES } from "@/content/learn/articles"
import { PEPTIDES } from "@/content/learn/peptides"
import { articleUrl, plainText } from "@/lib/article-seo"
import { BASE_URL, SITE } from "@/lib/config"

/** One line of prose: inline [label](url) links become their label, and line breaks become spaces. */
const line = (text: string) => plainText(text).replace(/\s+/g, " ").trim()

const item = (title: string, path: string, note?: string) =>
  `- [${line(title).replace(/[[\]]/g, "")}](${articleUrl(path)})${note ? `: ${line(note)}` : ""}`

const SECTIONS = [
  { title: "Home", path: "", note: "the latest guides, trial results, news and videos" },
  {
    title: "Peptide library",
    path: "/learn",
    note: "every peptide guide, grouped by topic, with how strong the evidence is",
  },
  {
    title: "News and articles",
    path: "/news",
    note: "new studies and regulatory decisions, explained, with every source linked",
  },
  {
    title: "Videos",
    path: "/videos",
    note: "hand-picked videos, mostly from doctors and researchers, including skeptical ones",
  },
  {
    title: "Community",
    path: "/community",
    note: "a public forum where people ask about the research and share what they noticed, including side effects, without doses",
  },
  { title: "Community guidelines", path: "/community/guidelines" },
  { title: "Contact", path: "/contact" },
]

/**
 * /llms.txt (https://llmstxt.org): a Markdown map of the site for AI assistants and crawlers, built
 * from the same content as the pages and the sitemap, so it stays current with every deploy. English
 * addresses only, since English is the only published language for now.
 */
function llmsText() {
  const guideSlugs = new Set(LEARNING_GUIDES.map((guide) => guide.slug))
  const news = ARTICLES.filter((article) => !guideSlugs.has(article.slug)).sort((a, b) => b.date.localeCompare(a.date))

  return [
    `# ${SITE.name}`,
    "",
    `> ${SITE.description}`,
    "",
    `${SITE.siteNotice} The guides are written for people who are not scientists. Every number comes from a linked source, mostly published studies and regulators. The site gives no doses and sells nothing. Many of the peptides covered are sold for research only and are not approved for use in people.`,
    "",
    "## Peptide guides",
    "",
    ...PEPTIDES.map((peptide) => item(peptide.name, `/learn/${peptide.slug}`, peptide.oneLiner)),
    "",
    "## Learning guides",
    "",
    ...LEARNING_GUIDES.map((guide) => item(guide.headline.join(""), `/news/${guide.slug}`, guide.dek)),
    "",
    "## News and studies",
    "",
    ...news.map((article) =>
      item(article.headline.join(""), `/news/${article.slug}`, `${article.date}. ${article.dek}`),
    ),
    "",
    "## Site sections",
    "",
    ...SECTIONS.map((section) => item(section.title, section.path, section.note)),
    "",
    "## Optional",
    "",
    ...LEGAL_DOCUMENTS.map((document) => item(document.title, `/legal/${document.slug}`)),
    `- [Sitemap](${BASE_URL}/sitemap.xml): every page, with its last change`,
    "",
  ].join("\n")
}

export function GET() {
  return new Response(llmsText(), { headers: { "Content-Type": "text/plain; charset=utf-8" } })
}
