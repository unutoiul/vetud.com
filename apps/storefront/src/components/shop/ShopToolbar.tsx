"use client"

import CloseIcon from "@mui/icons-material/Close"
import SearchIcon from "@mui/icons-material/Search"
import Chip from "@mui/material/Chip"
import FormControl from "@mui/material/FormControl"
import InputAdornment from "@mui/material/InputAdornment"
import InputLabel from "@mui/material/InputLabel"
import MenuItem from "@mui/material/MenuItem"
import Select from "@mui/material/Select"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import type { ProductSort } from "@/lib/medusa/products"

const SORTS: { value: ProductSort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name" },
]

type ShopToolbarProps = {
  categories: { handle: string; name: string }[]
  category?: string
  sort: ProductSort
  query?: string
  count: number
}

export default function ShopToolbar({ categories, category, sort, query, count }: ShopToolbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(query ?? "")

  const navigate = (changes: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const next = { q: query, category, sort: sort === "featured" ? undefined : sort, ...changes }
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value)
    }
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  return (
    <Stack spacing={3} sx={{ mb: 4 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" } }}>
        <Stack
          component="form"
          direction="row"
          sx={{ flex: 1, maxWidth: { md: 420 } }}
          onSubmit={(event) => {
            event.preventDefault()
            navigate({ q: search.trim() || undefined })
          }}
        >
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, code or lot"
            size="small"
            slotProps={{
              htmlInput: { "aria-label": "Search the catalog" },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Stack>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", ml: { md: "auto" } }}>
          <Typography variant="body2" sx={{ color: "text.secondary", whiteSpace: "nowrap" }} aria-live="polite">
            {count} {count === 1 ? "product" : "products"}
          </Typography>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="sort-label">Sort by</InputLabel>
            <Select
              labelId="sort-label"
              label="Sort by"
              value={sort}
              onChange={(event) => navigate({ sort: event.target.value === "featured" ? undefined : event.target.value })}
            >
              {SORTS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }} role="group" aria-label="Filter by category">
        <Chip
          label="All"
          clickable
          color={!category ? "primary" : "default"}
          variant={!category ? "filled" : "outlined"}
          onClick={() => navigate({ category: undefined })}
          aria-pressed={!category}
        />
        {categories.map((item) => (
          <Chip
            key={item.handle}
            label={item.name}
            clickable
            color={category === item.handle ? "primary" : "default"}
            variant={category === item.handle ? "filled" : "outlined"}
            onClick={() => navigate({ category: item.handle })}
            aria-pressed={category === item.handle}
          />
        ))}
        {query ? (
          <Chip
            label={`Search: “${query}”`}
            onDelete={() => {
              setSearch("")
              navigate({ q: undefined })
            }}
            deleteIcon={<CloseIcon />}
            color="secondary"
            variant="outlined"
          />
        ) : null}
      </Stack>
    </Stack>
  )
}
