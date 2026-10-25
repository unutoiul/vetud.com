const fs = require("node:fs")
const dotenv = require("../../apps/backend/node_modules/dotenv")

async function capture(live) {
  const env = dotenv.parse(fs.readFileSync(live ? ".vercel/.env.production.local" : "apps/storefront/.env.local"))
  const base = live ? env.NEXT_PUBLIC_MEDUSA_BACKEND_URL : "http://localhost:9000"
  const headers = { "x-publishable-api-key": env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY }
  const regionResponse = await fetch(`${base}/store/regions?fields=id,name,currency_code,metadata,*countries`, { headers })
  if (!regionResponse.ok) throw new Error(`Region response: ${regionResponse.status}`)
  const { regions } = await regionResponse.json()
  const markets = await Promise.all(regions.map(async region => {
    const response = await fetch(`${base}/store/products?region_id=${region.id}&fields=id,title,handle,description,subtitle,thumbnail,+metadata,*images,*variants,*variants.calculated_price,+variants.inventory_quantity&limit=100`, { headers })
    if (!response.ok) throw new Error(`Product response: ${response.status}`)
    return { region, products: (await response.json()).products }
  }))
  fs.writeFileSync(`output/qa/major-markets-${live ? "live" : "local"}-before.json`, JSON.stringify(markets, null, 2))
  console.log(`${live ? "Live" : "Local"}: saved ${markets.length} regions and their product prices.`)
}

async function main() {
  const source = "https://latest.currency-api.pages.dev/v1/currencies/eur.json"
  const response = await fetch(source)
  if (!response.ok) throw new Error(`Exchange-rate response: ${response.status}`)
  const feed = await response.json()
  const codes = ["eur", "usd", "cad", "aud", "jpy", "cny", "sgd", "hkd", "aed"]
  const rates = Object.fromEntries(codes.map(code => [code, feed.eur[code]]))
  if (Object.values(rates).some(rate => !(rate > 0))) throw new Error("A required rate is missing")
  fs.writeFileSync("output/qa/major-currency-rates.json", JSON.stringify({ source, date: feed.date, rates }, null, 2))
  console.log(JSON.stringify({ date: feed.date, rates }))
  await Promise.all([capture(false), capture(true)])
}

main().catch(error => { console.error(error); process.exit(1) })
