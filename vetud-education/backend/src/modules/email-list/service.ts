import { MedusaService } from "@medusajs/framework/utils"
import EmailSubscriber from "./models/email-subscriber"

class EmailListModuleService extends MedusaService({ EmailSubscriber }) {}

export default EmailListModuleService
