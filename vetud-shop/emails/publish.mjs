// Publishes the built templates to Resend (update, publish, then read back to verify).
// Needs RESEND_API_KEY in vetud-shop/backend/.env, and the logo live on the storefront first.
// Usage: node publish.mjs [template-name ...]     (no names: all templates)
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { LOGO_URL, buildAll } from "./build.mjs"

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const env = readFileSync(path.join(ROOT, "..", "backend", ".env"), "utf8")
const key = /^RESEND_API_KEY=(.*)$/m.exec(env)?.[1]?.trim().replace(/^["']|["']$/g, "")
if (!key) throw new Error("RESEND_API_KEY is missing from vetud-shop/backend/.env")

const logo = await fetch(LOGO_URL)
if (!logo.ok || !logo.headers.get("content-type")?.startsWith("image/png")) {
  throw new Error(`The logo isn't live at ${LOGO_URL} (${logo.status}). Deploy the storefront first.`)
}

const only = process.argv.slice(2)
const emails = buildAll().filter((email) => !only.length || only.includes(email.name))
if (only.length && emails.length !== only.length) throw new Error(`Unknown template in: ${only.join(", ")}`)

const resend = async (method, url, body) => {
  const res = await fetch(`https://api.resend.com${url}`, {
    method,
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(`${method} ${url}: ${res.status} ${JSON.stringify(json)}`)
  return json
}

for (const email of emails) {
  await resend("PATCH", `/templates/${email.id}`, { subject: email.subject, html: email.html, text: email.text })
  await resend("POST", `/templates/${email.id}/publish`)
  const live = await resend("GET", `/templates/${email.id}`)
  const ok = live.status === "published" && live.html === email.html && live.text === email.text
  console.log(`${ok ? "published" : "MISMATCH "}  ${email.name}`)
  if (!ok) process.exitCode = 1
}
