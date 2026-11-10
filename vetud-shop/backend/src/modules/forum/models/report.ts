import { model } from "@medusajs/framework/utils"

/** A member's report on a post. Enough open reports hide the post until staff review it. */
const ForumReport = model.define("forum_report", {
  id: model.id({ prefix: "frep" }).primaryKey(),
  post_id: model.text(),
  reporter_id: model.text(),
  reason: model.enum(["dose", "medical_claim", "spam", "abuse", "other"]),
  note: model.text().nullable(),
  status: model.enum(["open", "resolved"]).default("open"),
}).indexes([
  { name: "IDX_forum_report_post_reporter", on: ["post_id", "reporter_id"], unique: true, where: "deleted_at IS NULL" },
])

export default ForumReport
