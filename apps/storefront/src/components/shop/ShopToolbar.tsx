"use client"

import { CloseIcon, SearchIcon } from "@/components/brand/Icon"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Chip from "@mui/material/Chip"
import FormControl from "@mui/material/FormControl"
import InputAdornment from "@mui/material/InputAdornment"
import MenuItem from "@mui/material/MenuItem"
import Select from "@mui/material/Select"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import type { ProductSort } from "@/lib/medusa/products"
import { shopQuery, type CategoryFacet } from "@/lib/catalog-filters"

const SORTS: { value: ProductSort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name" },
]

const controlLabel = { fontSize: 13, fontWeight: 600, lineHeight: 1.5, mb: 1 }
const controlStyles = {
  height: 48,
  fontSize: { xs: 16, sm: 14 },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "primary.main", borderWidth: 1 },
  "&.Mui-focused": { boxShadow: "0 0 0 3px var(--mui-palette-brand-mintLight)" },
}

type ShopToolbarProps = {
  categories: CategoryFacet[]
  selectedCategories: string[]
  sort: ProductSort
  query?: string
  count: number
}

export default function ShopToolbar({ categories, selectedCategories, sort, query, count }: ShopToolbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(query ?? "")

  const navigate = (changes: { query?: string; sort?: ProductSort; categories?: string[] }) => {
    const qs = shopQuery({ query, categories: selectedCategories, sort, ...changes })
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  return (
    <Stack spacing={2} sx={{ mb: 3 }} data-shop-toolbar>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "minmax(0, 1fr) 208px" }, alignItems: "end", gap: 2 }}>
        <Stack
          component="form"
          method="get"
          action={pathname}
          role="search"
          aria-label="Product search"
          sx={{ minWidth: 0 }}
          onSubmit={(event) => {
            event.preventDefault()
            navigate({ query: search.trim() || undefined })
          }}
        >
          {selectedCategories.map(handle => <input key={handle} type="hidden" name="category" value={handle} />)}
          {sort !== "featured" ? <input type="hidden" name="sort" value={sort} /> : null}
          <Typography component="label" htmlFor="catalog-search" sx={controlLabel}>Search products</Typography>
          <TextField
            id="catalog-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, code or lot"
            size="small"
            sx={{ "& .MuiOutlinedInput-root": { ...controlStyles, pr: .25 } }}
            slotProps={{
              htmlInput: { name: "q", type: "search", autoComplete: "off", spellCheck: false, enterKeyHint: "search" },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end" sx={{ ml: .5 }}>
                    <Button type="submit" variant="contained" disableElevation sx={{ minWidth: 72, height: 44, minHeight: 44, px: 1.5, py: 0, fontSize: 13, transform: "none", "&:hover, &:active": { transform: "none" } }}>
                      Search
                    </Button>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Stack>
        <FormControl size="small" sx={{ minWidth: 0 }}>
          <Typography component="span" id="catalog-sort-label" sx={controlLabel}>Sort by</Typography>
          <Select
            id="catalog-sort"
            labelId="catalog-sort-label"
            name="sort"
            value={sort}
            sx={controlStyles}
            onChange={(event) => navigate({ sort: event.target.value as ProductSort })}
          >
            {SORTS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Stack direction="row" sx={{ minHeight: 40, alignItems: "center", justifyContent: "space-between", gap: 2, pb: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 13, fontVariantNumeric: "tabular-nums" }} aria-live="polite" aria-atomic="true">
          {count} {count === 1 ? "product" : "products"}
        </Typography>
        {selectedCategories.length || query ? <Button size="small" onClick={() => { setSearch(""); navigate({ query: undefined, categories: [] }) }} sx={{ minHeight: 44, px: 1, py: .5 }}>Clear filters</Button> : null}
      </Stack>

      {selectedCategories.length || query ? <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", alignItems: "center" }} role="group" aria-label="Active filters">
        {selectedCategories.map(handle => (
          <Chip
            key={handle}
            label={categories.find(category => category.handle === handle)?.name ?? "Unknown category"}
            variant="outlined"
            onDelete={() => navigate({ categories: selectedCategories.filter(item => item !== handle) })}
            deleteIcon={<CloseIcon />}
            sx={{ height: "auto", minHeight: 44, maxWidth: "100%", "& .MuiChip-label": { whiteSpace: "normal", py: 1 } }}
          />
        ))}
        {query ? (
          <Chip
            label={`Search: “${query}”`}
            onDelete={() => {
              setSearch("")
              navigate({ query: undefined })
            }}
            deleteIcon={<CloseIcon />}
            color="secondary"
            variant="outlined"
            sx={{ height: "auto", minHeight: 44, maxWidth: "100%", "& .MuiChip-label": { whiteSpace: "normal", py: 1 } }}
          />
        ) : null}
      </Stack> : null}
    </Stack>
  )
}
