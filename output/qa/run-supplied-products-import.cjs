const fs = require("node:fs/promises")
const path = require("node:path")
const crypto = require("node:crypto")
const { execFile } = require("node:child_process")
const { promisify } = require("node:util")
const run = promisify(execFile)

async function main() {
  const bundle = await fs.readFile("output/qa/import-supplied-products.bundle.cjs")
  const digest = crypto.createHash("sha256").update(bundle).digest("hex").slice(0, 16)
  const filename = `vetud-supplied-products-${digest}.js`
  // Only a content hash and base64 alphabet enter this shell command; no user text or credentials.
  const command = `set -eu; umask 077; printf %s '${bundle.toString("base64")}' | base64 -d > '/app/.medusa/server/src/scripts/${filename}'; cd /app/.medusa/server; node ./node_modules/@medusajs/cli/cli.js exec './src/scripts/${filename}'`
  const cli = path.join(process.env.APPDATA, "npm/node_modules/@railway/cli/bin/railway.js")
  const { stdout, stderr } = await run(process.execPath, [cli, "ssh", "--service", "medusa-server", "--environment", "production", "--", "sh", "-c", command], { cwd: path.resolve("apps/backend"), maxBuffer: 4 * 1024 * 1024, timeout: 120000 })
  await fs.writeFile(`output/qa/supplied-products-import-${digest}.log`, stdout + stderr)
  const line = stdout.split(/\r?\n/).find(line => line.includes("SUPPLIED_PRODUCTS_VERIFIED"))
  if (!line) throw new Error("Import did not return its verification report; inspect the saved log before retrying.")
  const record = JSON.parse(line)
  const report = JSON.parse(record.message.slice(record.message.indexOf("SUPPLIED_PRODUCTS_VERIFIED ") + "SUPPLIED_PRODUCTS_VERIFIED ".length))
  const phase = report.result.created.length ? "created" : "idempotent"
  await fs.writeFile(`output/qa/supplied-products-${phase}.json`, JSON.stringify({ checkedAt: new Date().toISOString(), bundleHash: digest, ...report }, null, 2))
  console.log(JSON.stringify({ phase, ...report }, null, 2))
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
