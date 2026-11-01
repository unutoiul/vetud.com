const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const targetRoute = process.argv[2] ?? '/us/learn/tesamorelin'
const emerging = /\/(ptt-a|cbl-514)$/.test(targetRoute)
const library = targetRoute.endsWith('/videos')
const outputPrefix = targetRoute.split('/').at(-1)
const browser = spawn('C:/Users/lucas/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe', ['--headless=new', '--disable-gpu', '--remote-debugging-port=9349', `--user-data-dir=${path.resolve('output/qa/learning-browser-profile')}`, '--no-first-run', 'about:blank'], { windowsHide: true, stdio: 'ignore' })
let ws
const checks = []
async function main() {
  let target
  for (let attempt = 0; attempt < 50; attempt++) {
    try { target = await (await fetch('http://127.0.0.1:9349/json/new?about:blank', { method: 'PUT' })).json(); break } catch { await delay(200) }
  }
  assert(target?.webSocketDebuggerUrl, 'Own headless browser started')
  ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
  let next = 0
  const waiting = new Map()
  const errors = []
  ws.onmessage = event => {
    const message = JSON.parse(event.data)
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text)
    if (message.id) { const pending = waiting.get(message.id); waiting.delete(message.id); message.error ? pending.reject(new Error(JSON.stringify(message.error))) : pending.resolve(message.result) }
  }
  function send(method, params = {}) { return new Promise((resolve, reject) => { const id = ++next; waiting.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })) }) }
  async function evaluate(expression) { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails)); return r.result.value }
  async function until(expression) { for (let i = 0; i < 80; i++) { if (await evaluate(expression)) return; await delay(200) } throw new Error('Timed out: ' + expression) }
  await send('Page.enable'); await send('Runtime.enable')
  for (const width of [1440, 390]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 600 })
    await send('Page.navigate', { url: 'http://localhost:8000' + targetRoute })
    await until(`document.readyState === 'complete' && document.querySelector('h1') !== null && ${library ? `document.querySelectorAll('a[href^="https://www.youtube.com/watch"]').length === 42` : `document.querySelector('[aria-label="Related research products"] a[href="/us/shop"]') !== null`}`)
    await evaluate('document.fonts.ready')
    assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true, `No horizontal overflow: ${width}`)
    assert.equal(await evaluate(`document.querySelectorAll('a[href^="https://www.youtube.com/watch"]').length >= 2`), true)
    if (!library) {
      assert.equal(await evaluate(`document.querySelector('[aria-label="Related research products"] a[href="/us/shop"]') !== null`), true)
      assert.equal(await evaluate(`document.querySelector('[aria-label="Research learning guides"] a') !== null`), true)
      assert.equal(await evaluate(`document.body.innerText.includes('Related biology') || document.body.innerText.includes('Research skills') || document.body.innerText.includes('Official regulatory recording')`), true)
    } else {
      await evaluate(`document.querySelector('a[href="#videos-research"]').click()`)
      await until(`location.hash === '#videos-research'`)
      assert.equal(await evaluate(`document.querySelectorAll('#videos-research article').length`), 4)
    }
    if (emerging) {
      assert.equal(await evaluate(`document.querySelector('[aria-label="PTT-A and CBL-514 evidence comparison"]') !== null`), true)
      assert.equal(await evaluate(`[...document.querySelectorAll('[aria-label*="average weight lost"]')].filter(el => !el.getAttribute('aria-label').startsWith('Placebo')).length`), 4, 'Only human trials receive weight-loss bars')
      assert.equal(await evaluate(`[...document.querySelectorAll('[aria-label*="average weight lost"]')].some(el => /PTT-A|CBL-514/.test(el.getAttribute('aria-label')))`), false)
      await evaluate(`document.querySelector('details').open = true`)
      assert.equal(await evaluate(`document.querySelectorAll('details tbody tr').length`), 4, 'Accessible table uses the same human trials')
    }
    for (const section of library ? ['library'] : [...(emerging ? ['comparison'] : []), 'video']) {
      const element = section === 'library' ? `document.querySelector('#videos-research')` : section === 'comparison' ? `document.querySelector('[aria-label="PTT-A and CBL-514 evidence comparison"]')` : `[...document.querySelectorAll('h2')].find(el => el.textContent.includes('Watch:')).parentElement`
      await evaluate(`(${element}).scrollIntoView({block:'start'})`)
      if (section === 'video' || section === 'library') {
        await evaluate(`[...(${element}).querySelectorAll('img')].forEach(img => img.loading = 'eager')`)
        await until(`[...(${element}).querySelectorAll('img')].every(img => img.complete && img.naturalWidth > 0)`)
      }
      const bounds = await evaluate(`(() => { const el = ${element}; const r=el.getBoundingClientRect();return {x:Math.max(0,r.x),y:r.y+scrollY,width:Math.min(r.width,innerWidth),height:r.height} })()`)
      const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { ...bounds, scale: 1 } })
      fs.writeFileSync(`output/qa/${outputPrefix}-${width}-${section}.png`, Buffer.from(shot.data, 'base64'))
    }
    await evaluate(`document.querySelector('${library ? '#videos-research ' : ''}button[aria-label^="Play "]').click()`)
    await until(`document.querySelector('iframe[src^="https://www.youtube-nocookie.com/embed/"]') !== null`)
    await evaluate(`document.querySelector('button[aria-label="Close video"]').click()`)
    await until(`document.querySelector('iframe[src^="https://www.youtube-nocookie.com/embed/"]') === null`)
    checks.push({ route: targetRoute, width, overflow: false, youtubeLinks: true, localizedShop: true, playerOpenAndClose: true, humanBarSeparation: emerging })
  }
  assert.deepEqual(errors, [], 'No uncaught page exceptions')
  fs.writeFileSync(`output/qa/${outputPrefix}-browser-check.json`, JSON.stringify({ checks, errors }, null, 2))
  console.log(JSON.stringify({ checks, errors }))
}
main().catch(error => { console.error(error); process.exitCode = 1 }).finally(() => { ws?.close(); browser.kill() })
