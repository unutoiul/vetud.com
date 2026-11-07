import { Module } from "@medusajs/framework/utils"
import LocalizedContentModuleService from "./service"

export const LOCALIZED_CONTENT_MODULE = "localizedContent"

export default Module(LOCALIZED_CONTENT_MODULE, { service: LocalizedContentModuleService })
