import { MedusaService } from "@medusajs/framework/utils"
import ArticleComment from "./models/article-comment"

class ArticleCommentModuleService extends MedusaService({ ArticleComment }) {}

export default ArticleCommentModuleService
