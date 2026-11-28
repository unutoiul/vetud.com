// Publishes the built templates to Resend: creates a template the first time (and records its ID),
// updates it afterwards, publishes it and reads it back to verify. Then rewrites the backend's
// template-ids.ts from templates.json, so the backend sends exactly these templates.
// Needs RESEND_API_KEY (environment, or vetud-shop/backend/.env), and the logo live on the storefront.
// Usage: node publish.mjs [template-name ...]     (no names: all templates)
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { LOGO_URL, buildAll, manifest } from "./build.mjs"

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const MANIFEST = path.join(ROOT, "templates.json")
const TEMPLATE_IDS = path.join(ROOT, "..", "backend", "src", "modules", "resend", "template-ids.ts")

function apiKey() {
  if (process.env.RESEND_API_KEY) return process.env.RESEND_API_KEY
  try {
    const env = readFileSync(path.join(ROOT, "..", "backend", ".env"), "utf8")
    return /^RESEND_API_KEY=(.*)$/m
      .exec(env)?.[1]
      ?.trim()
      .replace(/^["']|["']$/g, "")
  } catch {
    return undefined
  }
}
const key = apiKey()
if (!key) throw new Error("Set RESEND_API_KEY, or add it to vetud-shop/backend/.env")

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
  const meta = manifest[email.name]
  const content = { subject: email.subject, html: email.html, text: email.text }
  if (!meta.id) {
    const variables = meta.variables.map((variable) => ({ key: variable, type: "string", fallback_value: "" }))
    const created = await resend("POST", "/templates", { name: meta.name, alias: meta.alias, ...content, variables })
    meta.id = created.id
    writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n")
  } else {
    await resend("PATCH", `/templates/${meta.id}`, content)
  }
  await resend("POST", `/templates/${meta.id}/publish`)
  const live = await resend("GET", `/templates/${meta.id}`)
  const ok = live.status === "published" && live.html === email.html && live.text === email.text
  console.log(`${ok ? "published" : "MISMATCH "}  ${email.name}  ${meta.id}`)
  if (!ok) process.exitCode = 1
}

const ids = Object.entries(manifest)
  .filter(([, meta]) => meta.id)
  .map(([name, meta]) => `  "${name}": "${meta.id}",`)
writeFileSync(
  TEMPLATE_IDS,
  `import type { EmailTemplate } from "./templates"

/**
 * IDs of the published VETUD shop templates in Resend. Written by vetud-shop/emails/publish.mjs from
 * templates.json: change the emails there, not here.
 */
export const RESEND_TEMPLATE_IDS: Partial<Record<EmailTemplate, string>> = {
${ids.join("\n")}
}
`,
)
