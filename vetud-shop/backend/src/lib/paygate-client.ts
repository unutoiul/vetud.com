import { PayGate } from "paygate-to"
import { paygateError, type PaygateConfig } from "./paygate-config"

export function createPaygateClient(config: Pick<PaygateConfig, "apiDomain" | "checkoutDomain">) {
  return new PayGate({
    apiDomain: config.apiDomain,
    checkoutDomain: config.checkoutDomain,
    timeoutMs: 15000,
    retries: 1,
    fetch: async (input, init) => {
      const url = new URL(input)
      if (url.origin !== `https://${config.apiDomain}`) paygateError("Unexpected PayGate API origin.")
      // SDK 1.0 omits this directory's slash. The dedicated endpoint redirects it
      // to HTTP; use the canonical HTTPS path directly and keep redirects disabled.
      if (url.pathname === "/control/provider-status") url.pathname += "/"
      return fetch(url.href, { ...init, redirect: "manual" })
    },
  })
}
