import { model } from "@medusajs/framework/utils"

/**
 * A customer's public community identity. Posts show the display name and level, never the
 * customer record. Roles and status are set by staff in Admin > Community.
 */
const ForumProfile = model.define("forum_profile", {
  id: model.id({ prefix: "fprof" }).primaryKey(),
  customer_id: model.text().unique("IDX_forum_profile_customer_id"),
  display_name: model.text(),
  // URL-safe, lowercase form of the display name (/community/members/<handle>). Keeps names unique.
  handle: model.text().unique("IDX_forum_profile_handle"),
  role: model.enum(["member", "expert", "moderator"]).default("member"),
  // Shown next to an expert's name, e.g. "MD, endocrinology".
  credentials: model.text().nullable(),
  bio: model.text().nullable(),
  // Recounted from votes, best answers, logs and removals (src/lib/forum/reputation.ts).
  reputation: model.number().default(0),
  status: model.enum(["active", "muted", "banned"]).default("active"),
  guidelines_accepted_at: model.dateTime(),
})

export default ForumProfile
