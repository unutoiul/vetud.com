const fs = require("node:fs")
const path = require("node:path")
const { spawn } = require("node:child_process")
const dotenv = require("dotenv")

const root = path.resolve(__dirname, "..")
const file = path.join(root, ".env")
const env = { ...(fs.existsSync(file) ? dotenv.parse(fs.readFileSync(file)) : {}), ...process.env }
const database = new URL(env.DATABASE_URL || "postgres://vetud:vetud@localhost:5432/vetud_medusa")
if (!["localhost", "127.0.0.1", "[::1]"].includes(database.hostname)) {
  throw new Error("PayGate integration tests require a localhost PostgreSQL server. Remote database credentials are refused.")
}
const test = spawn(process.execPath, ["--experimental-vm-modules", path.join(root, "node_modules/jest/bin/jest.js"), "--runInBand", "--runTestsByPath", "integration-tests/http/paygate.spec.ts"], {
  cwd: root,
  env: { ...env, TEST_TYPE: "integration:http", DB_HOST: "localhost", DB_PORT: database.port || "5432", DB_USERNAME: decodeURIComponent(database.username), DB_PASSWORD: decodeURIComponent(database.password) },
  stdio: "inherit",
})
test.on("error", error => { console.error(error.message); process.exitCode = 1 })
test.on("exit", code => { process.exitCode = code || 0 })
