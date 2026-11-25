import { MedusaService } from "@medusajs/framework/utils"
import BeslimnowOrder from "./models/beslimnow-order"
import BeslimnowSubscriber from "./models/beslimnow-subscriber"

class BeslimnowModuleService extends MedusaService({ BeslimnowOrder, BeslimnowSubscriber }) {}

export default BeslimnowModuleService
