import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import type {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"
import { Resend } from "resend"
import { RESEND_TEMPLATE_IDS } from "./template-ids"
import { buildEmail } from "./templates"

type ResendOptions = {
  api_key: string
  from: string
  reply_to?: string
}

type InjectedDependencies = {
  logger: Logger
}

class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "notification-resend"

  private readonly client: Resend
  private readonly options: ResendOptions
  private readonly logger: Logger

  constructor({ logger }: InjectedDependencies, options: ResendOptions) {
    super()
    this.client = new Resend(options.api_key)
    this.options = options
    this.logger = logger
  }

  static validateOptions(options: Record<string, unknown>) {
    if (!options.api_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option `api_key` is required in the Resend provider's options."
      )
    }
    if (!options.from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option `from` is required in the Resend provider's options."
      )
    }
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const email = buildEmail(notification.template, notification.data ?? {})

    if (!email) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Unknown email template "${notification.template}".`
      )
    }

    const templateId = RESEND_TEMPLATE_IDS[email.template]
    if (!templateId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `No Resend template ID for "${email.template}" in template-ids.ts.`
      )
    }

    const { data, error } = await this.client.emails.send({
      from: notification.from || this.options.from,
      to: [notification.to],
      template: { id: templateId, variables: email.variables },
      subject: email.subject,
      replyTo: email.replyTo ?? this.options.reply_to,
      attachments: notification.attachments?.map((attachment) => ({
        content: attachment.content,
        filename: attachment.filename,
        contentType: attachment.content_type,
      })),
    })

    if (error || !data) {
      this.logger.error(
        `Resend failed to send "${notification.template}" to ${notification.to}: ${
          error?.message ?? "no response"
        }`
      )
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to send email: ${error?.message ?? "no response"}`
      )
    }

    return { id: data.id }
  }
}

export default ResendNotificationProviderService
