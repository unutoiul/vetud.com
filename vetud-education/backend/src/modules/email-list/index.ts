import { Module } from "@medusajs/framework/utils"
import EmailListModuleService from "./service"

export const EMAIL_LIST_MODULE = "emailList"

export default Module(EMAIL_LIST_MODULE, { service: EmailListModuleService })
