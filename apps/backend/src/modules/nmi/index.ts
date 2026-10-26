import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import NmiProvider from "./service"

export default ModuleProvider(Modules.PAYMENT, { services: [NmiProvider] })
