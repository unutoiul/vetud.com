import { Module } from "@medusajs/framework/utils"
import ForumModuleService from "./service"

export const FORUM_MODULE = "forum"

export default Module(FORUM_MODULE, { service: ForumModuleService })
