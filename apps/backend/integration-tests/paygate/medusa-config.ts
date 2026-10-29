import { defineConfig } from "@medusajs/framework/utils"
import path from "node:path"
import { getPaygateConfig } from "../../src/lib/paygate-config"

// Isolated integration-test app. Never imported by the production configuration.
const config = getPaygateConfig({
  PAYGATE_ENABLED: "true", PAYGATE_CALLBACK_SECRET: "a".repeat(64),
  PAYGATE_CARD_WALLET: `0x${"1".repeat(40)}`,
  PAYGATE_API_DOMAIN: "api.paygate.invalid", MEDUSA_BACKEND_URL: "https://api.shop.example",
})

module.exports = defineConfig({
  projectConfig: { databaseUrl: "postgres://vetud:vetud@localhost:5432/unused_test_placeholder", http: { jwtSecret: "test", cookieSecret: "test", storeCors: "", adminCors: "", authCors: "" } },
  admin: { disable: true },
  modules: [{ resolve: "@medusajs/medusa/payment", options: { providers: [{ resolve: path.resolve(process.cwd(), "src/modules/paygate"), id: "card", options: { ...config, mode: "card" } }] } }],
})
