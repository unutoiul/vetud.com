import { model } from "@medusajs/framework/utils"

/** A "helpful" vote. One per member per post; there are no downvotes. */
const ForumVote = model.define("forum_vote", {
  id: model.id({ prefix: "fvote" }).primaryKey(),
  post_id: model.text(),
  profile_id: model.text().index("IDX_forum_vote_profile_id"),
}).indexes([
  { name: "IDX_forum_vote_post_profile", on: ["post_id", "profile_id"], unique: true, where: "deleted_at IS NULL" },
])

export default ForumVote
