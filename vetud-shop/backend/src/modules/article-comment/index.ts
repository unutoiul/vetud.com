import { Module } from "@medusajs/framework/utils"
import ArticleCommentModuleService from "./service"

export const ARTICLE_COMMENT_MODULE = "articleComment"

export default Module(ARTICLE_COMMENT_MODULE, { service: ArticleCommentModuleService })
