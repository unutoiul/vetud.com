import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPaygateConfig } from "../../../../lib/paygate-config"

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  const config = getPaygateConfig()
  res.setHeader("Cache-Control", "no-store")
  res.json({ card: config.enabled && !!config.cardWallet, crypto: config.enabled && !!Object.keys(config.wallets).length })
}
