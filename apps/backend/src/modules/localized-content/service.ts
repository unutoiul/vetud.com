import { MedusaService } from "@medusajs/framework/utils"
import ContentBundle from "./models/content-bundle"

class LocalizedContentModuleService extends MedusaService({ ContentBundle }) {}

export default LocalizedContentModuleService
