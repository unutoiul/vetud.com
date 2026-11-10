import { model } from "@medusajs/framework/utils"

/**
 * A photo a member uploaded for a post. Uploads come first (post_id null), then the thread or
 * reply that uses them claims them; only the uploader can attach their own images.
 */
const ForumImage = model.define("forum_image", {
  id: model.id({ prefix: "fimg" }).primaryKey(),
  author_id: model.text().index("IDX_forum_image_author_id"),
  post_id: model.text().index("IDX_forum_image_post_id").nullable(),
  // The File Module's file, so the stored image can be removed with it.
  file_id: model.text(),
  url: model.text(),
})

export default ForumImage
