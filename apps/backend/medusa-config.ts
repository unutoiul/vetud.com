import { loadEnv, defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const REDIS_URL = process.env.REDIS_URL
const RESEND_API_KEY = process.env.RESEND_API_KEY

type ModuleConfig = {
  resolve: string
  options?: Record<string, unknown>
}

const modules: ModuleConfig[] = [
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
        ],
      },
    }
  )
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
  ],
  modules,
})
