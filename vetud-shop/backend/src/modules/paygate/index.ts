import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import PaygateProvider from "./service"

export default ModuleProvider(Modules.PAYMENT, { services: [PaygateProvider] })
