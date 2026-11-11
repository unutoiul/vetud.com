import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import EmailSignInCodeProvider from "./service"

/** Registered in medusa-config.ts under the Auth Module's `mfa.providers` as `email`. */
export default ModuleProvider(Modules.AUTH, {
  services: [EmailSignInCodeProvider],
})
