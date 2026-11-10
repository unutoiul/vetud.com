"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"

import { translateAction } from "@/i18n/actions"

import { useTranslations } from "next-intl"

import type { HttpTypes } from "@medusajs/types"
import Icon, { SearchIcon } from "@/components/brand/Icon"
import Autocomplete from "@mui/material/Autocomplete"
import Box from "@mui/material/Box"
import CircularProgress from "@mui/material/CircularProgress"
import InputAdornment from "@mui/material/InputAdornment"
import type { PopperProps } from "@mui/material/Popper"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, type ReactNode, type Ref } from "react"
import { sdk } from "@/lib/medusa/sdk"
import { cheapestPrice, readProductMeta } from "@/lib/product"
import { useMoney } from "@/lib/money"
import { shortAvailability } from "@/lib/product-formats"
import { getProductThumbnail } from "@/lib/product-images"
import { loadSearchIndex, rank, type ArticleEntry, type GuideEntry } from "@/lib/site-search"
import { formatArticleDate } from "@/content/learn/articles"
import { useStore } from "../store/StoreProvider"
import ProductThumb from "../product/ProductThumb"

const SEARCH_FIELDS = "id,title,handle,thumbnail,+metadata,*categories,*options,*variants.options,*variants.calculated_price"

/** One result; the groups always appear in this order. */
type Result =
  | { group: "Products"; key: string; label: string; href: string; product: HttpTypes.StoreProduct }
  | { group: "Peptide guides"; key: string; label: string; href: string; guide: GuideEntry }
  | { group: "News & articles"; key: string; label: string; href: string; article: ArticleEntry }

type SearchBoxProps = {
  autoFocus?: boolean
  inputRef?: Ref<HTMLInputElement>
  onNavigate?: () => void
  dense?: boolean
  /** Lists the results under the field, inside the dialog, instead of floating over the page. */
  inline?: boolean
}

/** The results of the inline search, in the page flow. */
function InlineResults({ open, children, className, role }: PopperProps) {
  return open ? <Box className={className} role={role} sx={{ width: "100%", mt: 1.5 }}>{children as ReactNode}</Box> : null
}

/** Searches products (Meilisearch), the peptide guides and the news, grouped by kind. */
export default function SearchBox({ autoFocus, inputRef, onNavigate, dense, inline }: SearchBoxProps) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const router = useRouter()
  const { countryCode, region } = useStore()
  const [input, setInput] = useState("")
  const [options, setOptions] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const latest = useRef(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  // Debounced search, run from the input handler so stale responses can be dropped.
  const onInput = (value: string) => {
    setInput(value)
    window.clearTimeout(timer.current)
    const query = value.trim()
    const requestId = ++latest.current
    if (query.length < 2) {
      setOptions([])
      setLoading(false)
      return
    }
    setLoading(true)
    timer.current = window.setTimeout(async () => {
      // Each source can fail on its own; the others still show.
      const [searchProducts, index] = await Promise.all([
        sdk.client.fetch<{ products: HttpTypes.StoreProduct[] }>("/store/meilisearch/products", { query: { query, limit: 5, region_id: region.id, fields: SEARCH_FIELDS } })
          .then((result) => result.products).catch(() => []),
        loadSearchIndex().catch(() => ({ guides: [], articles: [], products: [] })),
      ])
      if (requestId !== latest.current) return
      const translatedMatches = rank(index.products ?? [], query, product => [ct(product.title), [ct(product.description)], [product.title, product.description]], 5)
      const missingIds = translatedMatches.map(product => product.id).filter(id => !searchProducts.some(product => product.id === id))
      const additionalProducts = missingIds.length ? await sdk.store.product.list({ id: missingIds, region_id: region.id, fields: SEARCH_FIELDS, limit: 5 }).then(result => result.products).catch(() => []) : []
      if (requestId !== latest.current) return
      const products = [...searchProducts, ...additionalProducts].slice(0, 5)
      const guides = rank(index.guides, query, (guide) => [ct(guide.name), [guide.aka ?? "", guide.slug], [ct(guide.category), ct(guide.line), ct(guide.about), guide.name, guide.line]], 4)
      const articles = rank(index.articles, query, (article) => [ct(article.title), [ct(article.kind), ...article.peptides], [ct(article.dek), article.title, article.dek]], 4)
      setOptions([
        ...products.map((product): Result => ({ group: "Products", key: `p-${product.id}`, label: product.title, href: `/products/${product.handle}`, product })),
        ...guides.map((guide): Result => ({ group: "Peptide guides", key: `g-${guide.slug}`, label: guide.name, href: `/learn/${guide.slug}`, guide })),
        ...articles.map((article): Result => ({ group: "News & articles", key: `a-${article.slug}`, label: article.title, href: `/news/${article.slug}`, article })),
      ])
      setLoading(false)
    }, 220)
  }

  const go = (path: string) => {
    router.push(`/${countryCode}${path}`)
    onInput("")
    onNavigate?.()
  }

  return (
    <Autocomplete
      freeSolo
      options={options}
      groupBy={(option) => option.group}
      filterOptions={(items) => items}
      getOptionLabel={(option) => (typeof option === "string" ? option : option.label)}
      getOptionKey={(option) => (typeof option === "string" ? option : option.key)}
      inputValue={input}
      onInputChange={(_, value) => onInput(value)}
      loading={loading}
      onChange={(_, value) => {
        if (!value) return
        if (typeof value === "string") {
          if (value.trim()) go(`/shop?q=${encodeURIComponent(value.trim())}`)
        } else {
          go(value.href)
        }
      }}
      noOptionsText={input.trim().length < 2 ? act("searchHint") : act("noMatches")}
      sx={{ width: "100%" }}
      slots={inline ? { popper: InlineResults } : undefined}
      slotProps={{
        listbox: { sx: { maxHeight: inline ? "min(56vh, 520px)" : "min(60vh, 520px)", py: inline ? 0 : 1 } },
        paper: inline ? { elevation: 0, sx: { boxShadow: "none", border: "1px solid", borderColor: "divider", borderRadius: "10px" } } : undefined,
      }}
      renderGroup={(params) => (
        <Box component="li" key={params.key} sx={{ listStyle: "none" }}>
          <Typography component="div" sx={{ position: "sticky", top: inline ? 0 : -8, zIndex: 1, px: 2, py: 1, bgcolor: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "brand.blue", borderTop: "1px solid", borderColor: "divider" }}>{translateAction(act, params.group)}</Typography>
          <Box component="ul" sx={{ p: 0 }}>{ct(params.children)}</Box>
        </Box>
      )}
      renderOption={(props, option) => {
        const { key, ...rest } = props as typeof props & { key: string }
        return (
          <Box component="li" key={key} {...rest} sx={{ gap: 1.5, alignItems: "center !important", py: "8px !important", minHeight: 60 }}>
            {option.group === "Products" ? <ProductRow product={option.product} />
              : option.group === "Peptide guides" ? <ContentRow icon="molecule" title={ct(option.guide.name)} detail={option.guide.aka ? `${option.guide.aka} · ${ct(option.guide.line)}` : ct(option.guide.line)} />
              : <ContentRow icon="news" title={ct(option.article.title)} detail={`${ct(option.article.kind)} · ${formatArticleDate(option.article.date, ct.locale)}`} />}
          </Box>
        )
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          autoFocus={autoFocus}
          inputRef={inputRef}
          placeholder={act("siteSearch")}
          size={dense ? "small" : "medium"}
          // The Autocomplete has its own clear button; hide the browser's.
          sx={{ "& input::-webkit-search-cancel-button": { display: "none" } }}
          slotProps={{
            ...params.slotProps,
            htmlInput: {
              ...params.slotProps.htmlInput,
              "aria-label": ct("Search products, peptide guides and news"),
              name: "search",
              type: "search",
              autoComplete: "off",
              spellCheck: false,
            },
            input: {
              ...params.slotProps.input,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={16} /> : null}
                  {ct(params.slotProps.input.endAdornment)}
                </>
              ),
            },
          }}
        />
      )}
    />
  )
}

/** The leading picture of a result: the product's vial photo, or the icon of a guide or article. */
const MEDIA = { width: 48, height: 48, flexShrink: 0, borderRadius: "8px", overflow: "hidden" } as const

function ProductRow({ product }: { product: HttpTypes.StoreProduct }) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const money = useMoney()
  const meta = readProductMeta(product)
  const price = cheapestPrice(product)
  return <>
    <Box aria-hidden sx={{ ...MEDIA, border: "1px solid", borderColor: "divider", bgcolor: "#fff", p: 0.25 }}>
      <ProductThumb image={getProductThumbnail(product.handle, product.thumbnail, "Vial")} meta={meta} sizes="48px" />
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4 }} noWrap>{ct(product.title)}</Typography>
      <Typography sx={{ color: "text.secondary", fontSize: 12, lineHeight: 1.5 }} noWrap>{ct(meta.code)} · {shortAvailability(product, ct)}</Typography>
    </Box>
    {price ? (
      <Box sx={{ flexShrink: 0, textAlign: "right", pl: 1 }}>
        {price.hasRange ? <Typography component="div" sx={{ fontSize: 11, lineHeight: 1.3, color: "text.secondary" }}>{act("from")}</Typography> : null}
        <Typography component="div" sx={{ fontSize: 13.5, lineHeight: 1.4, fontWeight: 600, color: "text.primary", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{ct(money(price.amount, price.currencyCode))}</Typography>
      </Box>
    ) : null}
  </>
}

function ContentRow({ icon, title, detail }: { icon: "molecule" | "news"; title: string; detail: string }) {
  const ct = useContentTranslator()
  return <>
    <Box aria-hidden sx={{ ...MEDIA, display: "grid", placeItems: "center", bgcolor: "brand.mintWash", color: "brand.blue" }}>
      <Icon name={icon} sx={{ fontSize: 22 }} />
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>{ct(title)}</Typography>
      <Typography sx={{ color: "text.secondary", fontSize: 12, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{ct(detail)}</Typography>
    </Box>
  </>
}
