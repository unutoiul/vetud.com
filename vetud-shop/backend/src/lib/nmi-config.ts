import { MedusaError } from "@medusajs/framework/utils"

export const NMI_PROVIDER_ID = "pp_nmi_primary"

export function getNmiConfig(env: NodeJS.ProcessEnv = process.env) {
  const enabled = env.NMI_ENABLED === "true"
  const currency = env.NMI_ACCOUNT_CURRENCY?.trim().toLowerCase()
  const country = env.NMI_MERCHANT_COUNTRY?.trim().toUpperCase()
  if (enabled) {
    for (const key of ["NMI_SECURITY_KEY", "NMI_TOKENIZATION_KEY", "NMI_WEBHOOK_SECRET"]) {
      if (!env[key]?.trim()) throw new MedusaError(MedusaError.Types.INVALID_DATA, `${key} is required when NMI is enabled.`)
    }
    if (!currency || !/^[a-z]{3}$/.test(currency)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Set NMI_ACCOUNT_CURRENCY to the currency provisioned by your acquirer.")
    }
    if (!country || !/^[A-Z]{2}$/.test(country)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Set NMI_MERCHANT_COUNTRY to your registered merchant country.")
    }
    if (env.NMI_ENVIRONMENT && !["sandbox", "live"].includes(env.NMI_ENVIRONMENT)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "NMI_ENVIRONMENT must be sandbox or live.")
    }
    if (env.NMI_ACH_ENABLED === "true" && currency !== "usd") {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "NMI ACH requires a USD account.")
    }
  }
  return {
    enabled,
    currency_code: currency ?? null,
    merchant_country: country ?? null,
    ach_enabled: enabled && env.NMI_ACH_ENABLED === "true",
    wallets_enabled: enabled && env.NMI_WALLETS_ENABLED === "true",
    sandbox: env.NMI_ENVIRONMENT !== "live",
  }
}
