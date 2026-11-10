import { MedusaError } from "@medusajs/framework/utils"
import { HOSTED_NETWORKS, type HostedNetwork } from "paygate-to"

export const PAYGATE_CARD = "pp_paygate_card"
export const PAYGATE_CRYPTO = "pp_paygate_crypto"
export const isPaygate = (id?: string) => id === PAYGATE_CARD || id === PAYGATE_CRYPTO

export function paygateError(message: string): never {
  throw new MedusaError(MedusaError.Types.NOT_ALLOWED, message)
}

function domain(value: string, label: string) {
  const url = new URL(value.includes("://") ? value : `https://${value}`)
  if (url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash || url.pathname !== "/" || !url.hostname.includes(".")) {
    paygateError(`${label} must be a public HTTPS hostname without a path.`)
  }
  return url.hostname
}

export function getPaygateConfig(env: NodeJS.ProcessEnv = process.env) {
  const enabled = env.PAYGATE_ENABLED === "true"
  const cardWallet = env.PAYGATE_CARD_WALLET?.trim() || ""
  let wallets: Partial<Record<HostedNetwork, string>> = {}
  try { wallets = JSON.parse(env.PAYGATE_CRYPTO_WALLETS || "{}") } catch { paygateError("PAYGATE_CRYPTO_WALLETS must be a JSON object of network names and public payout addresses.") }
  if (!wallets || Array.isArray(wallets) || typeof wallets !== "object") paygateError("PAYGATE_CRYPTO_WALLETS must be an object.")
  for (const [network, address] of Object.entries(wallets)) {
    if (!(HOSTED_NETWORKS as readonly string[]).includes(network) || typeof address !== "string" || !/^[a-zA-Z0-9:_-]{20,200}$/.test(address)) {
      paygateError("Configure a valid public payout address for each supported PayGate network.")
    }
  }
  if (cardWallet && !/^0x[0-9a-fA-F]{40}$/.test(cardWallet)) paygateError("PAYGATE_CARD_WALLET must be an EVM public address.")
  if (wallets.evm && !/^0x[0-9a-fA-F]{40}$/.test(wallets.evm)) paygateError("The evm payout wallet must be an EVM public address.")
  const secret = env.PAYGATE_CALLBACK_SECRET || ""
  const apiDomain = domain(env.PAYGATE_API_DOMAIN || "api-vetudcom-6a438e9ca8f87c5e13025476.paygate.to", "PAYGATE_API_DOMAIN")
  const checkoutDomain = domain(env.PAYGATE_CHECKOUT_DOMAIN || "checkout.paygate.to", "PAYGATE_CHECKOUT_DOMAIN")
  const backendUrl = (env.MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
  const ratio = env.PAYGATE_CARD_MIN_NET_RATIO || "1"
  if (!/^(?:0\.9\d{0,3}|1(?:\.0{1,4})?)$/.test(ratio)) paygateError("PAYGATE_CARD_MIN_NET_RATIO must be between 0.9 and 1; the default requires the full invoice value.")
  if (enabled) {
    if (!/^[a-fA-F0-9]{64,128}$/.test(secret)) paygateError("Set a random PAYGATE_CALLBACK_SECRET of at least 64 hex characters.")
    if (!backendUrl.startsWith("https://")) paygateError("PayGate requires a public HTTPS MEDUSA_BACKEND_URL for signed callbacks.")
    if (!cardWallet && !Object.keys(wallets).length) paygateError("Configure at least one self-custodial payout wallet before enabling PayGate.")
  }
  return { enabled, cardWallet, wallets, secret, apiDomain, checkoutDomain, callbackUrl: `${backendUrl}/paygate/callback`, cardMinNetRatio: ratio }
}

export type PaygateConfig = ReturnType<typeof getPaygateConfig>
