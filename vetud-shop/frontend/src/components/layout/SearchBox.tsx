"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"

import { translateAction } from "@/i18n/actions"

import { useTranslations } from "next-intl"

import type { HttpTypes } from "@medusajs/types"
import Icon, { SearchIcon, type IconName } from "@/components/brand/Icon"
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
import { EMPTY_PRODUCT_MENU, looksLikeLot, toMenuProduct, type MenuProduct, type ProductMenuData } from "@/lib/product-menu"
import { loadSearchIndex, rank } from "@/lib/site-search"
import { useStore } from "../store/StoreProvider"
import { MenuProductRow } from "./ProductMenu"

const SEARCH_FIELDS = "id,title,subtitle,handle,thumbnail,+metadata,*categories,*options,*variants.options,*variants.calculated_price"
/** Results per search, and suggestions before anything is typed. */
const RESULTS = 6
const SUGGESTIONS = 6

/** One result: a product, or a link such as a category, a lot lookup or all results. Groups appear in order. */
type Result =
  | { kind: "product"; group: string; key: string; label: string; href: string; product: MenuProduct }
  | { kind: "link"; group: string; key: string; label: string; href: string; icon: IconName; detail?: string }

type SearchBoxProps = {
  autoFocus?: boolean
  inputRef?: Ref<HTMLInputElement>
  onNavigate?: () => void
  dense?: boolean
  /** Lists the results under the field, inside the dialog, instead of floating over the page. */
  inline?: boolean
  /** The catalog, for suggestions before typing and instant results while the full search runs. */
  catalog?: ProductMenuData
}

/** The results of the inline search, in the page flow. */
function InlineResults({ open, children, className, role }: PopperProps) {
  return open ? <Box className={className} role={role} sx={{ width: "100%", mt: 1.5 }}>{children as ReactNode}</Box> : null
}

const productResult = (product: MenuProduct, group: string): Result =>
  ({ kind: "product", group, key: `p-${product.id}`, label: product.title, href: `/products/${product.handle}`, product })

/**
 * Product search. Before typing it suggests products and categories. While typing it shows matches
 * from the catalog at once (in the reader's language, by name, code or handle), then adds
 * Meilisearch's matches. A lot number offers the lot lookup, and the last row opens all results.
 */
export default function SearchBox({ autoFocus, inputRef, onNavigate, dense, inline, catalog = EMPTY_PRODUCT_MENU }: SearchBoxProps) {
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

  const suggestions: Result[] = [
    ...catalog.products.slice(0, SUGGESTIONS).map((product) => productResult(product, "Popular products")),
    ...catalog.categories.map((category): Result => ({
      kind: "link", group: "Browse by category", key: `c-${category.handle}`, label: translateAction(act, category.name),
      href: `/shop?category=${encodeURIComponent(category.handle)}`, icon: "sliders", detail: ct.template("{v0} products", { v0: category.count }),
    })),
  ]

  const resultsFor = (query: string, products: MenuProduct[]): Result[] => [
    ...(looksLikeLot(query) ? [{
      kind: "link", group: "Lot documentation", key: "lot", label: `${act("lotLookup")} ${query.trim().toUpperCase()}`,
      href: `/documentation?lot=${encodeURIComponent(query.trim().toUpperCase())}`, icon: "document",
    } satisfies Result] : []),
    ...products.slice(0, RESULTS).map((product) => productResult(product, "Products")),
    { kind: "link", group: "Products", key: "all", label: ct.template("See all results for “{v0}”", { v0: query.trim() }), href: `/shop?q=${encodeURIComponent(query.trim())}`, icon: "search" },
  ]

  // Instant matches from the catalog, then the debounced full search; stale responses are dropped.
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
    const instant = rank(catalog.products, query, (product) => [ct(product.title), [product.code, product.handle, ct(product.subtitle)], [product.title, product.subtitle]], RESULTS)
    setOptions(resultsFor(query, instant))
    setLoading(true)
    timer.current = window.setTimeout(async () => {
      // Each source can fail on its own; the others still show.
      const [searchProducts, index] = await Promise.all([
        sdk.client.fetch<{ products: HttpTypes.StoreProduct[] }>("/store/meilisearch/products", { query: { query, limit: RESULTS, region_id: region.id, fields: SEARCH_FIELDS } })
          .then((result) => result.products).catch(() => []),
        loadSearchIndex().catch(() => ({ products: [] })),
      ])
      if (requestId !== latest.current) return
      const translatedMatches = rank(index.products ?? [], query, product => [ct(product.title), [ct(product.description)], [product.title, product.description]], RESULTS)
      const known = new Map(catalog.products.map((product) => [product.id, product]))
      const found = new Map<string, MenuProduct>()
      for (const product of instant) found.set(product.id, product)
      for (const product of searchProducts) {
        const entry = known.get(product.id) ?? toMenuProduct(product)
        if (entry) found.set(entry.id, entry)
      }
      const missingIds = translatedMatches.map(product => product.id).filter(id => !found.has(id))
      for (const id of missingIds) {
        const entry = known.get(id)
        if (entry) found.set(id, entry)
      }
      const unknownIds = missingIds.filter(id => !found.has(id))
      if (unknownIds.length) {
        const extra = await sdk.store.product.list({ id: unknownIds, region_id: region.id, fields: SEARCH_FIELDS, limit: RESULTS }).then(result => result.products).catch(() => [])
        if (requestId !== latest.current) return
        for (const product of extra) {
          const entry = toMenuProduct(product)
          if (entry) found.set(entry.id, entry)
        }
      }
      setOptions(resultsFor(query, [...found.values()]))
      setLoading(false)
    }, 220)
  }

  const go = (path: string) => {
    router.push(`/${countryCode}${path}`)
    onInput("")
    onNavigate?.()
  }

  const shown = input.trim().length < 2 ? suggestions : options

  return (
    <Autocomplete
      freeSolo
      openOnFocus
      options={shown}
      groupBy={(option) => option.group}
      filterOptions={(items) => items}
      getOptionLabel={(option) => (typeof option === "string" ? option : option.label)}
      getOptionKey={(option) => (typeof option === "string" ? option : option.key)}
      inputValue={input}
      onInputChange={(_, value, reason) => {
        if (reason !== "reset") onInput(value)
      }}
      loading={loading}
      onChange={(_, value) => {
        if (!value) return
        if (typeof value === "string") {
          if (value.trim()) go(`/shop?q=${encodeURIComponent(value.trim())}`)
        } else {
          go(value.href)
        }
      }}
      noOptionsText={act("noMatches")}
      sx={{ width: "100%" }}
      slots={inline ? { popper: InlineResults } : undefined}
      slotProps={{
        listbox: { sx: { maxHeight: inline ? "min(58vh, 560px)" : "min(60vh, 520px)", py: inline ? 0 : 1 } },
        paper: inline ? { elevation: 0, sx: { boxShadow: "none", border: "1px solid", borderColor: "divider", borderRadius: "10px" } } : undefined,
      }}
      renderGroup={(params) => (
        <Box component="li" key={params.key} sx={{ listStyle: "none" }}>
          <Typography component="div" sx={{ position: "sticky", top: inline ? 0 : -8, zIndex: 1, px: 2, py: 1, bgcolor: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "brand.blue", borderTop: "1px solid", borderColor: "divider" }}>{ct(translateAction(act, params.group))}</Typography>
          <Box component="ul" sx={{ p: 0 }}>{params.children}</Box>
        </Box>
      )}
      renderOption={(props, option) => {
        const { key, ...rest } = props as typeof props & { key: string }
        return (
          <Box component="li" key={key} {...rest} sx={{ gap: 1.5, alignItems: "center !important", py: "8px !important", minHeight: option.kind === "product" ? 64 : 52 }}>
            {option.kind === "product" ? <MenuProductRow product={option.product} /> : <LinkRow icon={option.icon} label={option.label} detail={option.detail} />}
          </Box>
        )
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          autoFocus={autoFocus}
          inputRef={inputRef}
          placeholder={ct("Search products, codes or lot numbers")}
          size={dense ? "small" : "medium"}
          // The Autocomplete has its own clear button; hide the browser's.
          sx={{ "& input::-webkit-search-cancel-button": { display: "none" } }}
          slotProps={{
            ...params.slotProps,
            htmlInput: {
              ...params.slotProps.htmlInput,
              "aria-label": ct("Search products"),
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

function LinkRow({ icon, label, detail }: { icon: IconName; label: string; detail?: string }) {
  const ct = useContentTranslator()
  return <>
    <Box aria-hidden sx={{ display: "grid", placeItems: "center", width: 48, height: 36, flexShrink: 0, borderRadius: "8px", bgcolor: "brand.mintWash", color: "brand.blue" }}>
      <Icon name={icon} sx={{ fontSize: 20 }} />
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography component="span" sx={{ display: "block", fontWeight: 600, fontSize: 14, lineHeight: 1.4 }} noWrap>{ct(label)}</Typography>
      {detail ? <Typography component="span" sx={{ display: "block", fontSize: 12, color: "text.secondary" }}>{ct(detail)}</Typography> : null}
    </Box>
  </>
}
