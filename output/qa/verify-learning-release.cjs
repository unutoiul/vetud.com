const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('../../apps/storefront/node_modules/typescript')
const { promisify } = require('node:util')
const run = promisify(require('node:child_process').execFile)
const loaded = new Map()
function source(relative) {
  const filename = path.resolve(relative)
  if (loaded.has(filename)) return loaded.get(filename)
  const exports = {}
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const context = { module: { exports }, exports, Intl, Date, URL, require: name => source(path.join(path.dirname(filename), name + '.ts')) }
  vm.runInNewContext(code, context, { filename })
  loaded.set(filename, context.module.exports)
  return context.module.exports
}
const { PEPTIDES } = source('apps/storefront/src/content/learn/peptides.ts')
const { ARTICLES } = source('apps/storefront/src/content/learn/articles.ts')
const { VIDEOS } = source('apps/storefront/src/content/learn/videos.ts')
const { getProfileVideoResources, getArticleVideos, getArticleVideoResources } = source('apps/storefront/src/content/learn/video-resources.ts')
const deployment = process.argv[2]
const cli = path.join(process.env.APPDATA, 'npm/node_modules/vercel/dist/vc.js')
async function getPage(route) {
  if (deployment && deployment !== 'local') {
    const { stdout } = await run(process.execPath, [cli, 'curl', route, '--deployment', deployment, '--scope', 'gold-structure-engine', '--', '--fail', '--silent', '--show-error', '--max-time', '45'], { maxBuffer: 15 * 1024 * 1024, timeout: 60000 })
    return stdout
  }
  const response = await fetch(`${deployment === 'local' ? 'http://localhost:8000' : 'https://www.vetud.com'}${route}`, { signal: AbortSignal.timeout(45000) })
  assert.equal(response.status, 200, route)
  return response.text()
}
async function main() {
  const pubmed = JSON.parse(fs.readFileSync('output/qa/pubmed-audit.json', 'utf8'))
  for (const item of [...PEPTIDES, ...ARTICLES]) {
    assert(item.sources.length, `Sources: ${item.slug}`)
    for (const link of item.sources) {
      assert.equal(new URL(link.url).protocol, 'https:')
      const pmid = link.url.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/)?.[1]
      if (pmid) assert(pubmed[pmid]?.title, `Unverified PubMed: ${pmid}`)
    }
  }
  for (const p of PEPTIDES) {
    const videos = getProfileVideoResources(p)
    assert(videos.videos.length >= 2, p.slug)
    assert.equal(new Set(videos.videos.map(video => video.id)).size, videos.videos.length, `Duplicate selection: ${p.slug}`)
    for (const video of videos.videos) assert(videos.connections[video.id]?.explanation, `Video connection: ${p.slug}/${video.id}`)
    for (const id of p.videos ?? []) assert(VIDEOS.some(video => video.id === id), `Unknown video: ${id}`)
  }
  for (const a of ARTICLES) {
    const peptides = a.peptides.map(id => PEPTIDES.find(p => p.slug === id))
    assert(peptides.every(Boolean), `Broken profile link: ${a.slug}`)
    assert.equal(getArticleVideos(a.slug, peptides).length, 3, `Article videos: ${a.slug}`)
    const selection = getArticleVideoResources(a.slug, peptides)
    for (const video of selection.videos) assert(selection.connections[video.id]?.explanation, `Article connection: ${a.slug}/${video.id}`)
  }
  const records = []
  const allJobs = [
    ...PEPTIDES.map(p => ({ route: `/us/learn/${p.slug}`, h1: p.name })),
    ...ARTICLES.map(a => ({ route: `/us/news/${a.slug}` })),
    ...['gb', 'de', 'fr', 'nl'].flatMap(country => ['tesamorelin', 'retatrutide', 'semaglutide'].map(slug => ({ route: `/${country}/learn/${slug}` }))),
  ]
  const focused = process.argv.includes('--focused')
  const jobs = focused ? [
    ...allJobs.filter(job => /^\/us\/(learn\/(tesamorelin|selank|cjc-1295|kisspeptin|pt-141)|news\/(from-cells-to-human-trials|body-weight-fat-and-muscle-results|cagrisema-vs-zepbound|cbl-514-fat-cells-self-destruct))$/.test(job.route)),
    { route: '/gb/learn/teriparatide' }, { route: '/de/learn/hgh' },
  ] : allJobs
  let next = 0
  async function worker() {
    while (next < jobs.length) {
      const job = jobs[next++]
      const raw = await getPage(job.route)
      const html = raw.replace(/<script\b[^]*?<\/script>/g, '').replace(/<style\b[^]*?<\/style>/g, '')
      assert(/<h1\b/.test(html), `Article heading: ${job.route}`)
      if (job.h1) assert(html.includes(job.h1.replaceAll('&', '&amp;')), `Article identity: ${job.route}`)
      const youtube = [...html.matchAll(/href="https:\/\/www.youtube.com\/watch\?v=([\w-]+)"/g)].map(m => m[1])
      assert(youtube.length, `Visible YouTube links: ${job.route}`)
      assert(youtube.every(id => VIDEOS.some(v => v.id === id)), `Uncurated video: ${job.route}`)
      assert(html.includes('Research learning guides'), `Learning-guide links: ${job.route}`)
      assert(/Discusses the compound|Related biology|Research skills|Official regulatory recording|Regulatory context/.test(html), `Video connection labels: ${job.route}`)
      assert(html.includes('>Sources<'), `Sources section: ${job.route}`)
      assert(html.includes('In the research shop'), `Research catalog: ${job.route}`)
      const country = job.route.split('/')[1]
      assert(html.includes(`href="/${country}/shop"`), `Localized shop link: ${job.route}`)
      assert(/href="\/[^/]+\/(learn|news)\/[^"#]+"/.test(html), `Related articles: ${job.route}`)
      assert(!/BLUETRENDY|08847487|839 Fulham|390 Fulham|SW6 5HQ/i.test(html), `Removed company details: ${job.route}`)
      if (job.route.endsWith('/tesamorelin')) {
        assert(!/\bHIV\b/i.test(html), `Requested tesamorelin copy: ${job.route}`)
        assert(html.includes('No matching product is currently listed for your region.'), `No fabricated tesamorelin product: ${job.route}`)
      }
      if (job.route.endsWith('/retatrutide')) assert(html.includes('In stock now'), `Real stock: ${job.route}`)
      if (job.route.endsWith('/semaglutide')) assert(html.includes('Out of stock'), `Sold-out stock: ${job.route}`)
      assert(!html.includes('We couldn’t check availability right now'), `Catalog API error: ${job.route}`)
      if (/\/(ptt-a|cbl-514)$/.test(job.route)) {
        assert(html.includes('PTT-A and CBL-514 evidence comparison'), `Emerging comparison: ${job.route}`)
        assert(html.includes('Not established'), `No invented human result: ${job.route}`)
        assert(!/aria-label="[^"]*(?:PTT-A|CBL-514)[^"]*average weight lost/.test(html), `No non-human or fat-volume weight bars: ${job.route}`)
        assert(html.includes('No matching product is currently listed for your region.'), `No invented product: ${job.route}`)
        if (deployment && deployment !== 'local') assert(html.includes('ADA conference abstract') && html.includes('EASD conference report'), `Source types visible: ${job.route}`)
      }
      records.push({ route: job.route, youtube: [...new Set(youtube)], passed: true })
    }
  }
  await Promise.all(Array.from({ length: deployment && deployment !== 'local' ? 4 : 5 }, worker))
  for (const route of ['/us/learn', '/us/news', '/us/videos', '/us/shop', '/gb/shop', '/sitemap.xml']) {
    const html = await getPage(route)
    assert(!/BLUETRENDY|08847487|839 Fulham|390 Fulham|SW6 5HQ/i.test(html), route)
    if (route.includes('sitemap')) for (const p of PEPTIDES) assert(html.includes(`/us/learn/${p.slug}`), `Sitemap: ${p.slug}`)
    if (route === '/us/learn') {
      assert(html.includes('PTT-A and CBL-514 evidence comparison'), 'Emerging research visible on Learn')
      assert(html.includes('href="/us/learn/ptt-a"') && html.includes('href="/us/learn/cbl-514"'), 'New library entries')
      assert(html.includes('href="/us/news/ptt-a-four-receptors-animal-evidence"'), 'New article link')
      assert(html.includes('href="/us/news/from-cells-to-human-trials"') && html.includes('href="/us/news/body-weight-fat-and-muscle-results"'), 'Both learning guides')
    }
    if (route === '/us/videos') for (const video of VIDEOS) assert(html.includes(`href="https://www.youtube.com/watch?v=${video.id}"`), `Video library: ${video.id}`)
    records.push({ route, passed: true })
  }
  const report = { checkedAt: new Date().toISOString(), deployment: deployment ?? 'https://www.vetud.com', profiles: PEPTIDES.length, articles: ARTICLES.length, curatedVideos: VIDEOS.length, verifiedPubmedRecords: Object.keys(pubmed).length, checks: records }
  fs.writeFileSync(`output/qa/learning-release-${deployment ? 'stage' : 'live'}.json`, JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ ...report, checks: records.length }))
}
module.exports = { source, PEPTIDES, ARTICLES, VIDEOS }
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1 })
