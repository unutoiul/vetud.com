const fs = require('node:fs')
const path = require('node:path')
const { spawn } = require('node:child_process')
const dotenv = require('../../apps/backend/node_modules/dotenv')
const parsed = dotenv.parse(fs.readFileSync('.vercel/.env.production.local'))
const publicEnv = Object.fromEntries(Object.entries(parsed).filter(([key, value]) => key.startsWith('NEXT_PUBLIC_') && value !== '[SENSITIVE]'))
const action = process.argv[2] === 'start' ? 'start' : 'build'
const child = spawn(process.execPath, [path.resolve('apps/storefront/node_modules/next/dist/bin/next'), action, ...(action === 'start' ? ['-p', '8000'] : [])], {
  cwd: 'apps/storefront', env: { ...process.env, ...publicEnv, NEXT_PUBLIC_BASE_URL: 'https://www.vetud.com' }, stdio: 'inherit', windowsHide: true,
})
if (action === 'start') fs.writeFileSync('output/qa/local-qa-server.json', JSON.stringify({ pid: child.pid, port: 8000 }))
child.on('exit', code => { process.exitCode = code ?? 1 })
