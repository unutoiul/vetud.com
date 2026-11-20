import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import EmailCodeAuthProvider from "./service"

export default ModuleProvider(Modules.AUTH, {
  services: [EmailCodeAuthProvider],
})
