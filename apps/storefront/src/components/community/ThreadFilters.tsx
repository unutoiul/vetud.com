"use client"

import Autocomplete from "@mui/material/Autocomplete"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Chip from "@mui/material/Chip"
import InputAdornment from "@mui/material/InputAdornment"
import MenuItem from "@mui/material/MenuItem"
import Tab from "@mui/material/Tab"
import Tabs from "@mui/material/Tabs"
import TextField from "@mui/material/TextField"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { CloseIcon, SearchIcon } from "@/components/brand/Icon"
import { getPeptide, PEPTIDES } from "@/content/learn/peptides"
import { KIND_PLURALS, THREAD_KINDS } from "@/lib/community/format"
import type { ThreadKind } from "@/lib/community/types"
import { useLocalizedHref } from "../common/links"

const KINDS: (ThreadKind | "all")[] = ["all", ...THREAD_KINDS]
const PEPTIDE_OPTIONS = [...PEPTIDES].sort((a, b) => a.name.localeCompare(b.name))
const SORTS = [
  { value: "latest", label: "Latest activity" },
  { value: "top", label: "Most helpful" },
  { value: "unanswered", label: "Unanswered questions" },
] as const

/**
 * The feed controls: thread type as tabs, sort beside them, then search and a peptide filter, and
 * the active filters as removable chips. Everything lives in the URL (the topic too), so a
 * filtered list can be shared and the back button works.
 */
export default function ThreadFilters() {
  const router = useRouter()
  const params = useSearchParams()
  const localize = useLocalizedHref()
  const [pending, startTransition] = useTransition()
  const [q, setQ] = useState(params.get("q") ?? "")
  const kind = KINDS.includes(params.get("kind") as ThreadKind) ? params.get("kind") as ThreadKind : "all"
  const sortParam = params.get("sort")
  const sort = sortParam === "top" || sortParam === "unanswered" ? sortParam : "latest"
  const peptide = getPeptide(params.get("peptide") ?? "")
  const lot = params.get("lot")
  const search = params.get("q")

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString())
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    next.delete("page")
    const query = next.toString()
    startTransition(() => router.push(localize(`/community${query ? `?${query}` : ""}`), { scroll: false }))
  }
  const filtered = Boolean(peptide || lot || search)

  return <Box aria-busy={pending} sx={{ display: "grid", gap: 2, mb: 1, opacity: pending ? .7 : 1, transition: "opacity .15s ease" }}>
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", columnGap: 2, rowGap: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
      <Tabs value={kind} onChange={(_, value: string) => update({ kind: value === "all" ? null : value, sort: value !== "question" && sort === "unanswered" ? null : sort === "latest" ? null : sort })}
        variant="scrollable" allowScrollButtonsMobile aria-label="Thread type" sx={{ minHeight: 44, mb: "-1px" }}>
        {KINDS.map(value => <Tab key={value} value={value} label={value === "all" ? "All threads" : KIND_PLURALS[value]} sx={{ minHeight: 44 }} />)}
      </Tabs>
      <TextField select size="small" label="Sort by" value={sort} sx={{ width: { xs: "100%", sm: 220 }, mb: 1.25 }}
        onChange={event => update({ sort: event.target.value === "latest" ? null : event.target.value, ...(event.target.value === "unanswered" ? { kind: "question" } : {}) })}>
        {SORTS.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
      </TextField>
    </Box>
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
      <Box component="form" role="search" aria-label="Search threads" onSubmit={event => { event.preventDefault(); update({ q: q.trim() || null }) }} sx={{ flex: "1 1 260px" }}>
        <TextField size="small" type="search" label="Search thread titles" value={q} onChange={event => setQ(event.target.value.slice(0, 80))} fullWidth
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: "text.secondary" }} /></InputAdornment> } }} />
      </Box>
      <Autocomplete size="small" options={PEPTIDE_OPTIONS} value={peptide ?? null} sx={{ flex: { xs: "1 1 100%", sm: "0 1 260px" } }}
        onChange={(_, option) => update({ peptide: option?.slug ?? null })}
        getOptionLabel={option => option.name} isOptionEqualToValue={(option, value) => option.slug === value.slug}
        renderInput={inputProps => <TextField {...inputProps} label="Peptide" />} />
    </Box>
    {filtered ? <Box role="group" aria-label="Active filters" sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
      {search ? <Chip label={`Title: “${search}”`} onDelete={() => { setQ(""); update({ q: null }) }} deleteIcon={<CloseIcon />} variant="outlined" sx={{ minHeight: 36 }} /> : null}
      {peptide ? <Chip label={peptide.name} onDelete={() => update({ peptide: null })} deleteIcon={<CloseIcon />} variant="outlined" sx={{ minHeight: 36 }} /> : null}
      {lot ? <Chip label={`Lot ${lot}`} onDelete={() => update({ lot: null })} deleteIcon={<CloseIcon />} variant="outlined" sx={{ minHeight: 36 }} /> : null}
      <Button size="small" onClick={() => { setQ(""); update({ q: null, peptide: null, lot: null }) }} sx={{ minHeight: 36 }}>Clear filters</Button>
    </Box> : null}
  </Box>
}
