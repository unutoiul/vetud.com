import { model } from "@medusajs/framework/utils"

/** One value of a research log at a given week (0 = baseline), in canonical units (src/lib/forum/metrics.ts). */
const ForumLogMeasurement = model.define("forum_log_measurement", {
  id: model.id({ prefix: "fmeas" }).primaryKey(),
  thread_id: model.text(),
  post_id: model.text().nullable(),
  metric: model.text(),
  week: model.number(),
  value: model.float(),
}).indexes([
  { name: "IDX_forum_log_measurement_thread_metric_week", on: ["thread_id", "metric", "week"], unique: true, where: "deleted_at IS NULL" },
])

export default ForumLogMeasurement
