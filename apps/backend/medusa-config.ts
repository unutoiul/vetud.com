import { loadEnv, defineConfig } from "@medusajs/framework/utils"
import { getNmiConfig } from "./src/lib/nmi-config"
import { getPaygateConfig } from "./src/lib/paygate-config"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const REDIS_URL = process.env.REDIS_URL
const RESEND_API_KEY = process.env.RESEND_API_KEY

type ModuleConfig = {
  resolve: string
  id?: string
  options?: Record<string, unknown>
}

const BACKEND_URL = (process.env.MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")

// MakePay hosted crypto checkout. Fully off unless MAKEPAY_ENCRYPTION_KEY is set (generate one with
// `openssl rand -base64 32`); then connect the store in Admin > Settings > MakePay and enable
// `pp_makepay_makepay` on each region (see README).
const MAKEPAY_ENABLED = Boolean(process.env.MAKEPAY_ENCRYPTION_KEY)
const makePayOptions = {
  authMode: "oauth" as const,
  backendUrl: BACKEND_URL,
  storefrontReturnUrl: `${(process.env.STOREFRONT_URL || "http://localhost:8000").replace(/\/$/, "")}/order/makepay-return`,
  encryptionKey: process.env.MAKEPAY_ENCRYPTION_KEY,
  lockingProvider: "makepay-postgres",
  settlementCurrency: process.env.MAKEPAY_SETTLEMENT_CURRENCY || "USDT",
  expirationTime: "12h",
  siteName: "Vetud Peptides",
}

const modules: ModuleConfig[] = [
  // Product images and other uploads. Files are written to `<server dir>/static` and served at
  // /static; on Railway that folder is a persistent volume (see README).
  {
    resolve: "@medusajs/medusa/file",
    options: {
      providers: [
        {
          resolve: "@medusajs/medusa/file-local",
          id: "local",
          options: { backend_url: `${BACKEND_URL}/static` },
        },
      ],
    },
  },
  // Medusa's Search Module, backed by Meilisearch. Index declarations live in src/search.
  {
    resolve: "@medusajs/medusa/search",
    options: {
      providers: [
        {
          resolve: "@rokmohar/medusa-plugin-meilisearch/providers/meilisearch",
          id: "meilisearch",
          options: {
            config: {
              host: process.env.MEILISEARCH_HOST || "http://localhost:7700",
              apiKey: process.env.MEILISEARCH_API_KEY,
            },
          },
        },
      ],
    },
  },
  // Transactional email. Without a Resend key (local dev), emails are logged to the console instead.
  {
    resolve: "@medusajs/medusa/notification",
    options: {
      providers: [
        RESEND_API_KEY
          ? {
              resolve: "./src/modules/resend",
              id: "resend",
              options: {
                channels: ["email"],
                api_key: RESEND_API_KEY,
                from: process.env.RESEND_FROM_EMAIL,
              },
            }
          : {
              resolve: "@medusajs/medusa/notification-local",
              id: "local",
              options: {
                channels: ["email"],
              },
            },
      ],
    },
  },
]

// Production infrastructure: Redis-backed caching, events, workflows and locking.
// Without REDIS_URL, Medusa falls back to its in-memory/local defaults (fine for local dev).
if (REDIS_URL) {
  modules.push(
    {
      resolve: "@medusajs/medusa/caching",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/caching-redis",
            id: "caching-redis",
            is_default: true,
            options: { redisUrl: process.env.CACHE_REDIS_URL || REDIS_URL },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: { redisUrl: REDIS_URL },
    },
    {
      resolve: "@medusajs/medusa/workflow-engine-redis",
      options: { redis: { redisUrl: REDIS_URL } },
    },
    {
      resolve: "@medusajs/medusa/locking",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/locking-redis",
            id: "locking-redis",
            is_default: true,
            options: { redisUrl: process.env.LOCKING_REDIS_URL || REDIS_URL },
          },
          // MakePay serialises OAuth token refresh and payment effects with a Postgres lock.
          ...(MAKEPAY_ENABLED
            ? [{ resolve: "@medusajs/medusa/locking-postgres", id: "makepay-postgres" }]
            : []),
        ],
      },
    }
  )
} else if (MAKEPAY_ENABLED) {
  modules.push({
    resolve: "@medusajs/medusa/locking",
    options: {
      providers: [
        {
          resolve: "@medusajs/medusa/locking-postgres",
          id: "makepay-postgres",
          is_default: true,
        },
      ],
    },
  })
}

// Payment providers besides the built-in manual/bank-transfer one. The Payment Module takes a single
// providers list, so every optional provider is added here. Enable each one on a region in Admin
// (Settings > Regions) as `pp_<resolve id>_<id>`, e.g. pp_paypal_paypal.
const paymentProviders: ModuleConfig[] = []
const paygate = getPaygateConfig()
if (paygate.enabled) {
  if (paygate.cardWallet) paymentProviders.push({ resolve: "./src/modules/paygate", id: "card", options: { ...paygate, mode: "card" } })
  if (Object.keys(paygate.wallets).length) paymentProviders.push({ resolve: "./src/modules/paygate", id: "crypto", options: { ...paygate, mode: "crypto" } })
}
const nmi = getNmiConfig()
if (nmi.enabled) {
  paymentProviders.push({
    resolve: "./src/modules/nmi",
    id: "primary",
    options: {
      securityKey: process.env.NMI_SECURITY_KEY,
      tokenizationKey: process.env.NMI_TOKENIZATION_KEY,
      webhookSecret: process.env.NMI_WEBHOOK_SECRET,
      captureMethod: "auth",
      secCode: "WEB",
      sandbox: nmi.sandbox,
      accountCurrency: nmi.currency_code,
      merchantCountry: nmi.merchant_country,
      achEnabled: nmi.ach_enabled,
      walletsEnabled: nmi.wallets_enabled,
    },
  } as ModuleConfig)
}
if (MAKEPAY_ENABLED) {
  paymentProviders.push({
    resolve: "@makecrypto/medusa-plugin-makepay/providers/makepay",
    id: "makepay",
    options: makePayOptions,
  } as ModuleConfig)
}
if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
  paymentProviders.push({
    resolve: "./src/modules/paypal",
    id: "paypal",
    options: {
      client_id: process.env.PAYPAL_CLIENT_ID,
      client_secret: process.env.PAYPAL_CLIENT_SECRET,
      environment: process.env.PAYPAL_ENVIRONMENT === "live" ? "live" : "sandbox",
      storefront_url: (process.env.STOREFRONT_URL || "http://localhost:8000").replace(/\/$/, ""),
      brand_name: "Vetud Peptides",
    },
  } as ModuleConfig)
}
if (paymentProviders.length) {
  modules.push({
    resolve: "@medusajs/medusa/payment",
    options: { providers: paymentProviders },
  })
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: REDIS_URL,
    workerMode: (process.env.MEDUSA_WORKER_MODE || "shared") as
      | "shared"
      | "worker"
      | "server",
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
  plugins: [
    {
      // Registers the Meilisearch admin page and /store/meilisearch/* routes.
      resolve: "@rokmohar/medusa-plugin-meilisearch",
      options: {},
    },
    {
      // Converts product prices from the store's default currency (EUR) into every enabled
      // currency, nightly and on demand (Admin > Currency Exchange Settings).
      resolve: "@kb0912/currency-exchange-plugin",
      options: {},
    },
    ...(MAKEPAY_ENABLED
      ? [{ resolve: "@makecrypto/medusa-plugin-makepay", options: makePayOptions }]
      : []),
  ],
  modules,
})
