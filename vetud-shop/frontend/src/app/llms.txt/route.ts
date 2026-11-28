import type { HttpTypes } from "@medusajs/types"
import { cacheLife, cacheTag } from "next/cache"
import { LEGAL_DOCUMENTS } from "@/content/legal"
import { BASE_URL, DEFAULT_COUNTRY, EDUCATION_URL, educationHref, SITE } from "@/lib/config"
import { listCatalogProducts } from "@/lib/medusa/products"
import { getRegionForCountry, listRegions } from "@/lib/medusa/regions"

/** One line of plain text: Markdown links, HTML tags and line breaks removed. */
const line = (text: string) =>
  text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[*_#>`]/g, "")
    .replace(/\s+/g, " ")
    .trim()

/** The first sentence, cut at a word near 200 characters. */
const summary = (text: string) => {
  const first = line(text).split(/(?<=[.!?])\s/)[0] ?? ""
  return first.length <= 200 ? first : `${first.slice(0, 200).replace(/\s+\S*$/, "")}…`
}

const page = (path: string) => `${BASE_URL}/${DEFAULT_COUNTRY}${path}`
const item = (title: string, url: string, note?: string) =>
  `- [${line(title).replace(/[[\]]/g, "")}](${url})${note ? `: ${note}` : ""}`

const PAGES = [
  {
    title: "Shop",
    path: "/shop",
    note: "every research material, with available amounts, regional prices, stock and lot documentation",
  },
  {
    title: "The dual-chamber pen, explained",
    path: "/dual-chamber-pen",
    note: "how the pen kit box, dual-chamber vials and vials differ",
  },
  {
    title: "Lot documentation",
    path: "/documentation",
    note: "look up a lot number for its batch date, purity result and certificate of analysis",
  },
  {
    title: "Our standards",
    path: "/standards",
    note: "how Vetud documents, describes, packs and supports what it sells",
  },
  { title: "Tracking", path: "/tracking", note: "follow a parcel with the tracking number from the shipping email" },
  { title: "Contact", path: "/contact" },
]

const productNote = (product: HttpTypes.StoreProduct) => {
  const text = product.subtitle?.trim() || product.description?.trim()
  return text ? summary(text) : undefined
}

/**
 * /llms.txt (https://llmstxt.org): a Markdown map of the shop for AI assistants and crawlers. The
 * product list comes from the default country's catalog, refreshed hourly like the sitemap.
 */
async function llmsText() {
  "use cache"
  cacheLife("hours")
  cacheTag("products")

  let products: HttpTypes.StoreProduct[] = []
  try {
    const region = (await getRegionForCountry(DEFAULT_COUNTRY)) ?? (await listRegions())[0]
    if (region) products = await listCatalogProducts(region.id)
  } catch {
    products = []
  }
  const listed = products
    .filter((product) => product.handle && product.title)
    .sort((a, b) => a.title.localeCompare(b.title))

  return [
    `# ${SITE.name}`,
    "",
    `> ${SITE.description}`,
    "",
    `${SITE.ruoNotice} ${SITE.shortName} gives no dosing or usage guidance. Prices and stock depend on the shopper's country; each country has its own addresses (${BASE_URL}/de/shop, ${BASE_URL}/fr/shop), and the links below are the ${DEFAULT_COUNTRY.toUpperCase()} store.`,
    "",
    "## Products",
    "",
    ...(listed.length
      ? listed.map((product) => item(product.title, page(`/products/${product.handle}`), productNote(product)))
      : [item("All products", page("/shop"))]),
    "",
    "## Shop pages",
    "",
    item("Home", BASE_URL),
    ...PAGES.map((entry) => item(entry.title, page(entry.path), entry.note)),
    "",
    "## Optional",
    "",
    ...LEGAL_DOCUMENTS.map((document) => item(document.title, page(`/legal/${document.slug}`))),
    item(
      "VETUD Learn",
      educationHref(),
      `plain-language guides to peptide research on a separate site, ${EDUCATION_URL.replace(/^https?:\/\//, "")}`,
    ),
    `- [Sitemap](${BASE_URL}/sitemap.xml): every page in every country`,
    "",
  ].join("\n")
}

export async function GET() {
  return new Response(await llmsText(), { headers: { "Content-Type": "text/plain; charset=utf-8" } })
}
