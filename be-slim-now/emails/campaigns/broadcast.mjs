// Puts an email campaign into Resend as a Broadcast draft: creates it the first time (and records its
// ID in campaigns.json), updates it afterwards. It never sends. Review the draft in Resend
// (Broadcasts), send yourself a test, then send or schedule it there.
// The pictures must be live first: run `npm run emails:campaign-images`, commit, deploy.
// Needs RESEND_API_KEY (environment, this project's .env.local/.env, or vetud-shop/backend/.env).
// Usage: npm run emails:campaign -- <campaign-name>        e.g. black-friday-2026
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const MANIFEST = path.join(HERE, "campaigns.json")
const ROOT = path.join(HERE, "..", "..")
/** Gmail clips messages above 102 KB. */
const MAX_BYTES = 100 * 1024

function apiKey() {
  if (process.env.RESEND_API_KEY) return process.env.RESEND_API_KEY
  for (const file of [
    path.join(ROOT, ".env.local"),
    path.join(ROOT, ".env"),
    path.join(ROOT, "..", "vetud-shop", "backend", ".env"),
  ]) {
    try {
      const value = /^RESEND_API_KEY=(.*)$/m
        .exec(readFileSync(file, "utf8"))?.[1]
        ?.trim()
        .replace(/^["']|["']$/g, "")
      if (value) return value
    } catch {
      // No such file: try the next one.
    }
  }
  return undefined
}

const name = process.argv[2]
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"))
const campaign = manifest[name]
if (!campaign) throw new Error(`Name a campaign from campaigns.json: ${Object.keys(manifest).join(", ")}`)

const html = readFileSync(path.join(HERE, `${name}.html`), "utf8")
const text = readFileSync(path.join(HERE, `${name}.txt`), "utf8")
const problems = []
if (Buffer.byteLength(html) > MAX_BYTES)
  problems.push(`HTML is ${Buffer.byteLength(html)} bytes, over Gmail's clipping limit`)
for (const body of [html, text])
  if (!body.includes("{{{RESEND_UNSUBSCRIBE_URL}}}")) problems.push("an unsubscribe link is missing")
if (problems.length) throw new Error(`${name}: ${problems.join("; ")}`)

// Every picture must be served before the campaign goes out.
const images = [...new Set([...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((match) => match[1]))]
for (const url of images) {
  const res = await fetch(url, { method: "HEAD" }).catch(() => null)
  const ok = res?.ok && res.headers.get("content-type")?.startsWith("image/")
  console.log(`${ok ? "live   " : "MISSING"}  ${url}`)
  if (!ok) problems.push(url)
}
if (problems.length) console.warn(`${problems.length} picture(s) aren't live yet: deploy the site before sending.`)

const key = apiKey()
if (!key) throw new Error("Set RESEND_API_KEY, or add it to .env.local")
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

const content = {
  name: campaign.name,
  segment_id: campaign.segmentId,
  from: campaign.from,
  reply_to: campaign.replyTo,
  subject: campaign.subject,
  preview_text: campaign.previewText,
  html,
  text,
}
if (campaign.id) {
  await resend("PATCH", `/broadcasts/${campaign.id}`, content)
} else {
  const created = await resend("POST", "/broadcasts", content)
  campaign.id = created.id
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n")
}
const live = await resend("GET", `/broadcasts/${campaign.id}`)
console.log(
  `${live.status}  ${campaign.name}  ${campaign.id}  (${live.html === html ? "content matches" : "CONTENT DIFFERS"})`,
)
console.log(`Review it at https://resend.com/broadcasts/${campaign.id}`)
