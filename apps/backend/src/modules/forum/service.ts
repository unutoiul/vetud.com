import { MedusaService } from "@medusajs/framework/utils"
import ForumLogMeasurement from "./models/measurement"
import ForumPost from "./models/post"
import ForumProfile from "./models/profile"
import ForumReport from "./models/report"
import ForumThread from "./models/thread"
import ForumVote from "./models/vote"

class ForumModuleService extends MedusaService({
  ForumProfile,
  ForumThread,
  ForumPost,
  ForumLogMeasurement,
  ForumVote,
  ForumReport,
}) {}

export default ForumModuleService
