"use client"

import type { HttpTypes } from "@medusajs/types"
import Icon, { SearchIcon } from "@/components/brand/Icon"
import Autocomplete from "@mui/material/Autocomplete"
import Box from "@mui/material/Box"
import CircularProgress from "@mui/material/CircularProgress"
import InputAdornment from "@mui/material/InputAdornment"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { useEffect, useRef, useState, type Ref } from "react"
import { sdk } from "@/lib/medusa/sdk"
import { cheapestPrice, formatMoney, readProductMeta } from "@/lib/product"
import { shortAvailability } from "@/lib/product-formats"
import { loadSearchIndex, rank, type ArticleEntry, type GuideEntry } from "@/lib/site-search"
import { useStore } from "../store/StoreProvider"

const SEARCH_FIELDS = "id,title,handle,+metadata,*categories,*options,*variants.options,*variants.calculated_price"

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
}

/** Searches products (Meilisearch), the peptide guides and the news, grouped by kind. */
export default function SearchBox({ autoFocus, inputRef, onNavigate, dense }: SearchBoxProps) {
  const router = useRouter()
  const locale = useLocale()
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
      const [products, index] = await Promise.all([
        sdk.client.fetch<{ products: HttpTypes.StoreProduct[] }>("/store/meilisearch/products", { query: { query, limit: 5, region_id: region.id, fields: SEARCH_FIELDS } })
          .then((result) => result.products).catch(() => []),
        loadSearchIndex().catch(() => ({ guides: [], articles: [] })),
      ])
      if (requestId !== latest.current) return
      const guides = rank(index.guides, query, (guide) => [guide.name, [guide.aka ?? "", guide.slug], [guide.category, guide.line, guide.about]], 4)
      const articles = rank(index.articles, query, (article) => [article.title, [article.kind, ...article.peptides], [article.dek]], 4)
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
      noOptionsText={input.trim().length < 2 ? "Type a peptide, product, code or topic" : "No matches"}
      sx={{ width: "100%" }}
      slotProps={{ listbox: { sx: { maxHeight: "min(60vh, 520px)" } } }}
      renderGroup={(params) => (
        <Box component="li" key={params.key} sx={{ listStyle: "none" }}>
          <Typography component="div" sx={{ position: "sticky", top: -8, zIndex: 1, px: 2, py: 1, bgcolor: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "brand.blue", borderTop: "1px solid", borderColor: "divider" }}>{params.group}</Typography>
          <Box component="ul" sx={{ p: 0 }}>{params.children}</Box>
        </Box>
      )}
      renderOption={(props, option) => {
        const { key, ...rest } = props as typeof props & { key: string }
        return (
          <Box component="li" key={key} {...rest} sx={{ gap: 1.5, alignItems: "flex-start !important" }}>
            {option.group === "Products" ? <ProductRow product={option.product} locale={locale} />
              : option.group === "Peptide guides" ? <ContentRow icon="molecule" title={option.guide.name} detail={option.guide.aka ? `${option.guide.aka} · ${option.guide.line}` : option.guide.line} />
              : <ContentRow icon="news" title={option.article.title} detail={`${option.article.kind} · ${option.article.date}`} />}
          </Box>
        )
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          autoFocus={autoFocus}
          inputRef={inputRef}
          placeholder="Search products, peptides, news…"
          size={dense ? "small" : "medium"}
          // The Autocomplete has its own clear button; hide the browser's.
          sx={{ "& input::-webkit-search-cancel-button": { display: "none" } }}
          slotProps={{
            ...params.slotProps,
            htmlInput: {
              ...params.slotProps.htmlInput,
              "aria-label": "Search products, peptide guides and news",
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
                  {params.slotProps.input.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  )
}

function ProductRow({ product, locale }: { product: HttpTypes.StoreProduct; locale: string }) {
  const meta = readProductMeta(product)
  const price = cheapestPrice(product)
  return <>
    <Box aria-hidden sx={{ width: 10, height: 10, mt: 0.75, borderRadius: "50%", bgcolor: meta.accent, flexShrink: 0 }} />
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontWeight: 600, fontSize: 14 }} noWrap>{product.title}</Typography>
      <Typography sx={{ color: "text.secondary", fontSize: 12 }} noWrap>{meta.code} · {shortAvailability(product)}</Typography>
    </Box>
    {price ? (
      <Typography sx={{ fontSize: 13, color: "text.secondary", whiteSpace: "nowrap" }}>
        {price.hasRange ? "from " : ""}
        {formatMoney(price.amount, price.currencyCode, { locale })}
      </Typography>
    ) : null}
  </>
}

function ContentRow({ icon, title, detail }: { icon: "molecule" | "news"; title: string; detail: string }) {
  return <>
    <Icon name={icon} aria-hidden sx={{ fontSize: 18, mt: 0.25, color: "brand.blue", flexShrink: 0 }} />
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>{title}</Typography>
      <Typography sx={{ color: "text.secondary", fontSize: 12, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{detail}</Typography>
    </Box>
  </>
}
