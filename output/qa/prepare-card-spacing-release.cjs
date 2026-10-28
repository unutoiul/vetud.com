const fs = require("node:fs/promises")
const path = require("node:path")
const crypto = require("node:crypto")
const { execFile } = require("node:child_process")
const { promisify } = require("node:util")
const run = promisify(execFile)
const workspace = process.cwd()
const stage = path.resolve(workspace, "output/releases/card-spacing")
const deployment = "dpl_BzjT5t9HroMw1JUDjmHsh1cN4SzJ"
const cli = process.argv[2]
const digest = buffer => crypto.createHash("sha1").update(buffer).digest("hex")

async function main() {
  const files = JSON.parse(await fs.readFile("output/qa/hero-production-source-files.json", "utf8"))
  let next = 0
  let restored = 0
  async function worker() {
    while (next < files.length) {
      const item = files[next++]
      const destination = path.resolve(stage, item.path)
      if (!destination.startsWith(stage + path.sep)) throw new Error("Source path escaped release folder")
      let content = await fs.readFile(item.path).catch(() => null)
      if (!content || digest(content) !== item.uid) {
        const { stdout } = await run(process.execPath, [cli, "api", `/v7/deployments/${deployment}/files/${item.uid}`, "--scope", "gold-structure-engine", "--raw"], { maxBuffer: 15 * 1024 * 1024 })
        const response = JSON.parse(stdout)
        content = Buffer.from(response.data, "base64")
        restored++
      }
      if (digest(content) !== item.uid) throw new Error(`Source hash mismatch: ${item.path}`)
      await fs.mkdir(path.dirname(destination), { recursive: true })
      await fs.writeFile(destination, content)
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker))
  const carousel = "apps/storefront/src/components/home/CollectionCarousel.tsx"
  await fs.copyFile(carousel, path.join(stage, carousel))
  await fs.mkdir(path.join(stage, ".vercel"), { recursive: true })
  await fs.copyFile(".vercel/project.json", path.join(stage, ".vercel/project.json"))
  console.log(JSON.stringify({ stage, files: files.length, restored, changed: [carousel] }))
}

main().catch(error => { console.error(error.message); process.exitCode = 1 })
