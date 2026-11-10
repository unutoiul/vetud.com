import { model } from "@medusajs/framework/utils"

/** The opening post or a reply. Plain text, plus any photos (forum_image) attached to it. */
const ForumPost = model.define("forum_post", {
  id: model.id({ prefix: "fpost" }).primaryKey(),
  thread_id: model.text().index("IDX_forum_post_thread_id"),
  author_id: model.text().index("IDX_forum_post_author_id"),
  body: model.text(),
  is_opening: model.boolean().default(false),
  // "pending" posts wait for review (hold_reason says why); "hidden" were reported or hidden by staff.
  status: model.enum(["published", "pending", "hidden", "removed"]).default("published"),
  hold_reason: model.text().nullable(),
  helpful_count: model.number().default(0),
  edited_at: model.dateTime().nullable(),
})

export default ForumPost
