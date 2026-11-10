/** Site settings for emails, read at send time so they can change without a rebuild. */
export function emailSettings() {
  return {
    storefrontUrl: (process.env.STOREFRONT_URL || "http://localhost:8100").replace(/\/$/, ""),
    adminUrl: (process.env.MEDUSA_BACKEND_URL || "http://localhost:9100").replace(/\/$/, ""),
    ownerEmail: process.env.STORE_OWNER_EMAIL,
  }
}
