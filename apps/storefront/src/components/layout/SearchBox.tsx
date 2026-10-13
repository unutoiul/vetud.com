"use client"

import type { HttpTypes } from "@medusajs/types"
import { SearchIcon } from "@/components/brand/Icon"
import Autocomplete from "@mui/material/Autocomplete"
import Box from "@mui/material/Box"
import CircularProgress from "@mui/material/CircularProgress"
import InputAdornment from "@mui/material/InputAdornment"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, type Ref } from "react"
import { sdk } from "@/lib/medusa/sdk"
import { cheapestPrice, formatMoney, readProductMeta } from "@/lib/product"
import { useStore } from "../store/StoreProvider"

const SEARCH_FIELDS = "id,title,handle,+metadata,*categories,*variants.calculated_price"

type SearchBoxProps = {
  autoFocus?: boolean
  inputRef?: Ref<HTMLInputElement>
  onNavigate?: () => void
  dense?: boolean
}

export default function SearchBox({ autoFocus, inputRef, onNavigate, dense }: SearchBoxProps) {
  const router = useRouter()
  const { countryCode, region } = useStore()
  const [input, setInput] = useState("")
  const [options, setOptions] = useState<HttpTypes.StoreProduct[]>([])
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
      try {
        const { products } = await sdk.client.fetch<{ products: HttpTypes.StoreProduct[] }>(
          "/store/meilisearch/products",
          { query: { query, limit: 6, region_id: region.id, fields: SEARCH_FIELDS } }
        )
        if (requestId === latest.current) setOptions(products)
      } catch {
        if (requestId === latest.current) setOptions([])
      } finally {
        if (requestId === latest.current) setLoading(false)
      }
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
      filterOptions={(items) => items}
      getOptionLabel={(option) => (typeof option === "string" ? option : option.title)}
      inputValue={input}
      onInputChange={(_, value) => onInput(value)}
      loading={loading}
      onChange={(_, value) => {
        if (!value) return
        if (typeof value === "string") {
          if (value.trim()) go(`/shop?q=${encodeURIComponent(value.trim())}`)
        } else if (value.handle) {
          go(`/products/${value.handle}`)
        }
      }}
      noOptionsText={input.trim().length < 2 ? "Type a name, code or lot number" : "No matches"}
      sx={{ width: "100%" }}
      renderOption={(props, option) => {
        const { key, ...rest } = props as typeof props & { key: string }
        const meta = readProductMeta(option)
        const price = cheapestPrice(option)
        return (
          <Box component="li" key={key} {...rest} sx={{ gap: 1.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: meta.accent, flexShrink: 0 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 600, fontSize: 14 }} noWrap>
                {option.title}
              </Typography>
              <Typography variant="mono" sx={{ color: "text.secondary", fontSize: 11 }}>
                {meta.code}
              </Typography>
            </Box>
            {price ? (
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                {price.hasRange ? "from " : ""}
                {formatMoney(price.amount, price.currencyCode)}
              </Typography>
            ) : null}
          </Box>
        )
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          autoFocus={autoFocus}
          inputRef={inputRef}
          placeholder="Search products, codes, lots…"
          size={dense ? "small" : "medium"}
          slotProps={{
            ...params.slotProps,
            htmlInput: {
              ...params.slotProps.htmlInput,
              "aria-label": "Search products",
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
