import { cacheLife, cacheTag } from "next/cache"
import type { NmiConfig } from "../nmi"
import type { PaygateConfig } from "../paygate"
import { isOfferedPaymentProvider } from "../payment-providers"
import { sdk } from "./sdk"

/**
 * The payment providers the checkout offers in a region, in the backend's order: the same filter the
 * checkout applies (isOfferedPaymentProvider), for pages that describe how to pay.
 */
export async function listOfferedPaymentProviders(regionId: string, currency: string): Promise<string[]> {
  "use cache"
  cacheLife("minutes")
  cacheTag("payment-providers")

  const [{ payment_providers }, nmi, paygate] = await Promise.all([
    sdk.store.payment.listPaymentProviders({ region_id: regionId }),
    sdk.client.fetch<NmiConfig>("/store/nmi/config", { method: "GET" }).catch(() => null),
    sdk.client.fetch<PaygateConfig>("/store/paygate/config", { method: "GET" }).catch(() => null),
  ])
  return payment_providers.map((provider) => provider.id).filter((id) => isOfferedPaymentProvider(id, { nmi, paygate, currency }))
}
