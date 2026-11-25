import { Module } from "@medusajs/framework/utils"
import BeslimnowModuleService from "./service"

/** Orders and pop-up signups from the BeSlimNow pen page (tables beslimnow_orders, beslimnow_subscribers). */
export const BESLIMNOW_MODULE = "beslimnow"

export default Module(BESLIMNOW_MODULE, { service: BeslimnowModuleService })
