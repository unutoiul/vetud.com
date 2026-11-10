import { model } from "@medusajs/framework/utils"

/** A signed-in customer's comment on a storefront article. Articles live in the storefront, so they are referenced by slug. */
const ArticleComment = model.define("article_comment", {
  id: model.id({ prefix: "acom" }).primaryKey(),
  article_slug: model.text().index("IDX_article_comment_article_slug"),
  customer_id: model.text().index("IDX_article_comment_customer_id"),
  // Snapshot of the public name ("Lucas F."), so listing comments never exposes customer records.
  author_name: model.text(),
  body: model.text(),
})

export default ArticleComment
