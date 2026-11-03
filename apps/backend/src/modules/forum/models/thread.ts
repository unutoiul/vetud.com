import { model } from "@medusajs/framework/utils"

/**
 * A discussion or question. The text lives in its opening post; the thread holds
 * what lists and filters need. Peptides are storefront library slugs, products are referenced by
 * handle, and lots are checked against the product's `metadata.lots` when the thread is created.
 */
const ForumThread = model.define("forum_thread", {
  id: model.id({ prefix: "fthr" }).primaryKey(),
  author_id: model.text().index("IDX_forum_thread_author_id"),
  kind: model.enum(["discussion", "question"]),
  title: model.text(),
  slug: model.text(),
  excerpt: model.text(),
  peptide_slug: model.text().index("IDX_forum_thread_peptide_slug").nullable(),
  product_handle: model.text().nullable(),
  lot: model.text().index("IDX_forum_thread_lot").nullable(),
  // The author has a paid, non-canceled order for `product_handle`.
  verified_purchase: model.boolean().default(false),
  // Mirrors the opening post: only "published" threads are listed publicly.
  status: model.enum(["published", "pending", "hidden", "removed"]).default("published"),
  hold_reason: model.text().nullable(),
  pinned: model.boolean().default(false),
  locked: model.boolean().default(false),
  accepted_post_id: model.text().nullable(),
  reply_count: model.number().default(0),
  helpful_count: model.number().default(0),
  last_activity_at: model.dateTime(),
})

export default ForumThread
