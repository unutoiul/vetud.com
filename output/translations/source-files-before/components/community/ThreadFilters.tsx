"use client"
import { translateAction } from "@/i18n/actions"
import { useTranslations } from "next-intl"


import Autocomplete from "@mui/material/Autocomplete"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Chip from "@mui/material/Chip"
import IconButton from "@mui/material/IconButton"
import InputAdornment from "@mui/material/InputAdornment"
import MenuItem from "@mui/material/MenuItem"
import Tab from "@mui/material/Tab"
import Tabs from "@mui/material/Tabs"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
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
const FIELD_SX = { "& .MuiOutlinedInput-root": { minHeight: 48, borderRadius: "10px" } }
const LABEL_SX = { display: "block", mb: .75, fontSize: 13, fontWeight: 600, color: "brand.navySoft" }

/** Remount the search draft when the URL changes, including browser back/forward. */
export default function ThreadFilters() {
  const params = useSearchParams()
  return <ThreadFilterControls key={params.get("q") ?? ""} />
}

/** Shareable URL filters. Changing a filter always returns to the first page. */
function ThreadFilterControls() {
  const act = useTranslations("Actions")
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

  return <Box aria-busy={pending} sx={{ display: "grid", gap: 2.5, mb: 2.5 }}>
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
      <Tabs value={kind} onChange={(_, value: string) => update({ kind: value === "all" ? null : value, sort: value !== "question" && sort === "unanswered" ? null : sort === "latest" ? null : sort })}
        variant="fullWidth" aria-label={act("threadType")} sx={{ width: { xs: "100%", sm: "auto" }, minHeight: 44, p: .5, bgcolor: "brand.mintWash", border: "1px solid", borderColor: "divider", borderRadius: "12px", "& .MuiTabs-indicator": { display: "none" }, "& .MuiTabs-list": { gap: .5 } }}>
        {KINDS.map(value => <Tab key={value} value={value} label={value === "all" ? act("allThreads") : translateAction(act, KIND_PLURALS[value])} sx={{ minHeight: 40, minWidth: 0, px: { xs: 1, sm: 2.25 }, py: 1, mr: 0, borderRadius: "8px", fontSize: 14, color: "brand.navySoft", "&.Mui-selected": { bgcolor: "background.paper", color: "brand.navy", boxShadow: "0 1px 4px rgba(21,38,94,.10)" }, "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "brand.blue", outlineOffset: "-2px" } }} />)}
      </Tabs>
      <Typography role="status" sx={{ fontSize: 13, color: "text.secondary", ...(pending ? {} : { position: "absolute", width: 1, height: 1, p: 0, overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap" }) }}>{pending ? act("updatingThreads") : ""}</Typography>
    </Box>
    <Box component="fieldset" disabled={pending} sx={{ m: 0, p: { xs: 2, sm: 2.5 }, minWidth: 0, border: "1px solid", borderColor: "divider", borderRadius: "14px", bgcolor: "brand.paper", display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "minmax(220px, 1fr) minmax(170px, .55fr) minmax(210px, .6fr)" }, gap: 2 }}>
      <Box component="form" role="search" aria-label={act("searchThreads")} onSubmit={event => { event.preventDefault(); update({ q: q.trim() || null }) }} sx={{ minWidth: 0, gridColumn: { sm: "1 / -1", md: "auto" } }}>
        <Typography component="label" htmlFor="community-search" sx={LABEL_SX}>{act("searchThreads")}</Typography>
        <TextField id="community-search" size="small" placeholder={act("searchTitles")} value={q} onChange={event => setQ(event.target.value.slice(0, 80))} fullWidth sx={FIELD_SX}
          slotProps={{ htmlInput: { maxLength: 80 }, input: {
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: "text.secondary" }} /></InputAdornment>,
            endAdornment: <InputAdornment position="end" sx={{ gap: .5, ml: .5 }}>
              {q ? <IconButton size="small" aria-label={act("clearSearch")} disabled={pending} onClick={() => { setQ(""); if (search) update({ q: null }) }}><CloseIcon sx={{ fontSize: 16 }} /></IconButton> : null}
              <Button type="submit" size="small" disabled={pending} sx={{ minWidth: "auto", px: 1.25, py: .75, minHeight: 36, borderRadius: "6px", bgcolor: "brand.mintWash", fontSize: 12 }}>{act("search")}</Button>
            </InputAdornment>,
          } }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography component="label" htmlFor="community-peptide" sx={LABEL_SX}>{act("peptide")}</Typography>
        <Autocomplete id="community-peptide" size="small" options={PEPTIDE_OPTIONS} value={peptide ?? null} disabled={pending} sx={FIELD_SX}
          onChange={(_, option) => update({ peptide: option?.slug ?? null })}
          getOptionLabel={option => option.name} isOptionEqualToValue={(option, value) => option.slug === value.slug}
          renderInput={inputProps => <TextField {...inputProps} placeholder={act("allPeptides")} />} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography id="community-sort-label" component="label" htmlFor="community-sort" sx={LABEL_SX}>{act("sortBy")}</Typography>
        <TextField id="community-sort" select size="small" value={sort} disabled={pending} sx={FIELD_SX}
          slotProps={{ select: { labelId: "community-sort-label" } }}
          onChange={event => update({ sort: event.target.value === "latest" ? null : event.target.value, ...(event.target.value === "unanswered" ? { kind: "question" } : {}) })}>
          {SORTS.map(option => <MenuItem key={option.value} value={option.value}>{translateAction(act, option.label)}</MenuItem>)}
        </TextField>
      </Box>
    </Box>
    {filtered ? <Box role="group" aria-label={act("activeFilters")} sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
      <Typography sx={{ fontSize: 13, color: "text.secondary", mr: .5 }}>Filtered by</Typography>
      {search ? <Chip label={act("titleFilter", { title: search })} disabled={pending} onDelete={() => { setQ(""); update({ q: null }) }} deleteIcon={<CloseIcon />} variant="outlined" sx={{ minHeight: 36, maxWidth: "100%" }} /> : null}
      {peptide ? <Chip label={peptide.name} disabled={pending} onDelete={() => update({ peptide: null })} deleteIcon={<CloseIcon />} variant="outlined" sx={{ minHeight: 36 }} /> : null}
      {lot ? <Chip label={act("lotFilter", { lot: lot })} disabled={pending} onDelete={() => update({ lot: null })} deleteIcon={<CloseIcon />} variant="outlined" sx={{ minHeight: 36 }} /> : null}
      <Button size="small" disabled={pending} onClick={() => { setQ(""); update({ q: null, peptide: null, lot: null }) }} sx={{ minHeight: 36 }}>{act("clearFilters")}</Button>
    </Box> : null}
  </Box>
}
