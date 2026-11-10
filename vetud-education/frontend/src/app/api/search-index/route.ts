import { ARTICLES } from "@/content/learn/articles"
import { getCategory } from "@/content/learn/categories"
import { getPeptide, PEPTIDES } from "@/content/learn/peptides"
import type { SearchIndex } from "@/lib/site-search"

/** The learning library and the news, compact, for the header search. Prerendered at build. */
export async function GET() {
  const index: SearchIndex = {
    guides: PEPTIDES.map((peptide) => ({ slug: peptide.slug, name: peptide.name, aka: peptide.aka, line: peptide.oneLiner, category: getCategory(peptide.category).name, about: peptide.whatItIs })),
    articles: [...ARTICLES]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((article) => ({
        slug: article.slug, title: article.headline.join(""), dek: article.dek, kind: article.kind, date: article.date,
        peptides: article.peptides.flatMap((slug) => {
          const peptide = getPeptide(slug)
          return peptide ? [slug, peptide.name, peptide.aka ?? ""].filter(Boolean) : [slug]
        }),
      })),
  }
  return Response.json(index)
}
