"use client"

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Checkbox from "@mui/material/Checkbox"
import Drawer from "@mui/material/Drawer"
import IconButton from "@mui/material/IconButton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { usePathname, useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import Icon from "@/components/brand/Icon"
import { shopQuery, type CategoryFacet } from "@/lib/catalog-filters"
import type { ProductSort } from "@/lib/medusa/products"

type Props = { categories: CategoryFacet[]; selected: string[]; query?: string; sort: ProductSort }

function CategoryOptions({ categories, selected, onToggle, disabled }: {
  categories: CategoryFacet[]
  selected: string[]
  onToggle: (handle: string) => void
  disabled: boolean
}) {
  return <Stack spacing={3.5}>
    {(["research", "format"] as const).map(group => {
      const items = categories.filter(category => category.group === group)
      if (!items.length) return null
      return <Box component="fieldset" key={group} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
        <Typography component="legend" sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary", mb: 1.25, p: 0 }}>{group === "research" ? "Research areas" : "Product type"}</Typography>
        {items.map(category => <Box component="label" key={category.id} sx={{ display: "flex", alignItems: "center", gap: 1, minHeight: 48, py: .5, cursor: disabled ? "wait" : "pointer", color: selected.includes(category.handle) ? "text.primary" : "text.secondary", "&:hover": { color: "primary.main" } }}>
          <Checkbox name="category" value={category.handle} checked={selected.includes(category.handle)} onChange={() => onToggle(category.handle)} disabled={disabled} size="small" slotProps={{ input: { "aria-label": `${category.name}, ${category.count} ${category.count === 1 ? "product" : "products"}` } }} sx={{ p: .5, ml: -.5 }} />
          <Typography component="span" sx={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.6 }}>{category.name}</Typography>
          <Typography component="span" sx={{ flexShrink: 0, minWidth: 27, px: .75, py: .25, border: "1px solid", borderColor: "divider", borderRadius: 10, textAlign: "center", fontSize: 12, fontVariantNumeric: "tabular-nums", bgcolor: selected.includes(category.handle) ? "brand.mintLight" : "background.paper" }}>{category.count}</Typography>
        </Box>)}
      </Box>
    })}
  </Stack>
}

export default function CategoryFilters({ categories, selected, query, sort }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(selected)
  const [pending, startTransition] = useTransition()
  const navigate = (selection: string[]) => {
    const params = shopQuery({ query, sort, categories: selection })
    startTransition(() => router.push(params ? `${pathname}?${params}` : pathname, { scroll: false }))
  }
  const toggle = (selection: string[], handle: string) => selection.includes(handle) ? selection.filter(item => item !== handle) : [...selection, handle]
  const hidden = <>
    {query ? <input type="hidden" name="q" value={query} /> : null}
    {sort !== "featured" ? <input type="hidden" name="sort" value={sort} /> : null}
  </>

  return <>
    <Box component="aside" aria-label="Product categories" sx={{ display: { xs: "none", lg: "block" }, position: "sticky", top: 112, alignSelf: "start" }}>
      <Stack direction="row" sx={{ minHeight: 44, mb: 2, alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography component="h2" sx={{ fontSize: 18, lineHeight: 1.5, fontWeight: 600, letterSpacing: "-.02em" }}>Categories</Typography>
        {selected.length ? <Button size="small" onClick={() => navigate([])} disabled={pending} sx={{ minHeight: 44 }}>Clear</Button> : null}
      </Stack>
      <Box component="form" method="get" action={pathname} aria-busy={pending} onSubmit={event => { event.preventDefault(); navigate(selected) }}>
        {hidden}
        <CategoryOptions categories={categories} selected={selected} onToggle={handle => navigate(toggle(selected, handle))} disabled={pending} />
        <Button type="submit" variant="outlined" fullWidth disabled={pending} sx={{ mt: 3 }}>Apply categories</Button>
      </Box>
    </Box>

    <Button variant="outlined" disabled={pending} startIcon={<Icon name="sliders" />} onClick={() => { setDraft(selected); setOpen(true) }} sx={{ display: { xs: "inline-flex", lg: "none" }, justifySelf: "start", minHeight: 44 }}>
      Categories{selected.length ? ` (${selected.length})` : ""}
    </Button>
    <Drawer anchor="left" open={open} onClose={() => setOpen(false)} slotProps={{ paper: { "aria-labelledby": "category-filter-title", sx: { width: "min(92vw, 380px)", p: 3, pt: "max(24px, env(safe-area-inset-top))", pb: "max(24px, env(safe-area-inset-bottom))" } } }}>
      <Box component="form" method="get" action={pathname} sx={{ minHeight: "100%", display: "flex", flexDirection: "column" }} onSubmit={event => { event.preventDefault(); navigate(draft); setOpen(false) }}>
        {hidden}
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography id="category-filter-title" component="h2" sx={{ fontSize: 24, fontWeight: 500 }}>Categories</Typography>
          <IconButton aria-label="Close categories" onClick={() => setOpen(false)} sx={{ width: 44, height: 44 }}><Icon name="close" /></IconButton>
        </Stack>
        <CategoryOptions categories={categories} selected={draft} onToggle={handle => setDraft(value => toggle(value, handle))} disabled={pending} />
        <Stack direction="row" spacing={1.5} sx={{ mt: "auto", pt: 3, pb: 1 }}>
          <Button type="button" variant="outlined" onClick={() => setDraft([])} sx={{ minHeight: 48 }}>Clear</Button>
          <Button type="submit" variant="contained" disabled={pending} sx={{ flex: 1, minHeight: 48 }}>Apply categories</Button>
        </Stack>
      </Box>
    </Drawer>
  </>
}
