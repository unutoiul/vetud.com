import type { CreateNotificationDTO } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export const sendNotificationStep = createStep(
  "send-notification",
  async (data: CreateNotificationDTO[], { container }) => {
    if (!data.length) {
      return new StepResponse([])
    }

    const notificationModuleService = container.resolve(Modules.NOTIFICATION)
    const notifications = await notificationModuleService.createNotifications(data)

    return new StepResponse(notifications)
  }
)
