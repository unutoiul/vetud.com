import { MedusaService } from "@medusajs/framework/utils"
import ForumImage from "./models/image"
import ForumPost from "./models/post"
import ForumProfile from "./models/profile"
import ForumReport from "./models/report"
import ForumThread from "./models/thread"
import ForumVote from "./models/vote"

class ForumModuleService extends MedusaService({
  ForumProfile,
  ForumThread,
  ForumPost,
  ForumVote,
  ForumReport,
  ForumImage,
}) {}

export default ForumModuleService
