import { loadEnv, defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const REDIS_URL = process.env.REDIS_URL
const RESEND_API_KEY = process.env.RESEND_API_KEY
const BACKEND_URL = (process.env.MEDUSA_BACKEND_URL || "http://localhost:9100").replace(/\/$/, "")

type ModuleConfig = {
  resolve: string
  id?: string
  options?: Record<string, unknown>
}

// Medusa's commerce modules stay on with empty tables: it needs them to start and the Admin expects them.
const modules: ModuleConfig[] = [
  // Sign-in: email and password, then a 6-digit code sent by email (src/modules/email-mfa).
  // Medusa still adds AUTH_MFA_ENCRYPTION_KEY to these MFA options by itself.
  {
    resolve: "@medusajs/medusa/auth",
    options: {
      providers: [{ resolve: "@medusajs/medusa/auth-emailpass", id: "emailpass" }],
      mfa: {
        challenge_ttl_seconds: 600,
        challenge_max_attempts: 5,
        providers: [{ resolve: "./src/modules/email-mfa", id: "email", options: { secret: process.env.JWT_SECRET } }],
      },
    },
  },
  // Comments signed-in members leave on articles.
  { resolve: "./src/modules/article-comment" },
  // Community forum: profiles, threads, votes and reports.
  { resolve: "./src/modules/forum" },
  // People who asked for new guides by email.
  { resolve: "./src/modules/email-list" },
  // Community photos. Files are written to `<server dir>/static` and served at /static;
  // on Railway that folder is a persistent volume.
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
              options: { channels: ["email"] },
            },
      ],
    },
  },
]

// Without REDIS_URL, Medusa falls back to its in-memory defaults (fine for local dev).
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
            options: { redisUrl: REDIS_URL },
          },
        ],
      },
    },
    { resolve: "@medusajs/medusa/event-bus-redis", options: { redisUrl: REDIS_URL } },
    { resolve: "@medusajs/medusa/workflow-engine-redis", options: { redis: { redisUrl: REDIS_URL } } },
    {
      resolve: "@medusajs/medusa/locking",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/locking-redis",
            id: "locking-redis",
            is_default: true,
            options: { redisUrl: REDIS_URL },
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
    workerMode: (process.env.MEDUSA_WORKER_MODE || "shared") as "shared" | "worker" | "server",
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
    // Available to Admin pages as __STOREFRONT_URL__, for links to threads and articles.
    storefrontUrl: process.env.STOREFRONT_URL,
  },
  modules,
})
