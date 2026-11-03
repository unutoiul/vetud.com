"use client"

import Autocomplete from "@mui/material/Autocomplete"
import Box from "@mui/material/Box"
import Chip from "@mui/material/Chip"
import Tab from "@mui/material/Tab"
import Tabs from "@mui/material/Tabs"
import TextField from "@mui/material/TextField"
import ToggleButton from "@mui/material/ToggleButton"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { getPeptide, PEPTIDES } from "@/content/learn/peptides"
import { KIND_PLURALS, THREAD_KINDS } from "@/lib/community/format"
import type { ThreadKind } from "@/lib/community/types"
import { useLocalizedHref } from "../common/links"

const KINDS: (ThreadKind | "all")[] = ["all", ...THREAD_KINDS]
const PEPTIDE_OPTIONS = [...PEPTIDES].sort((a, b) => a.name.localeCompare(b.name))

/** Kind, sort, peptide and search filters, kept in the URL so filtered lists can be shared. */
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

  return <Box aria-busy={pending} sx={{ display: "grid", gap: 2, mb: 1 }}>
    <Tabs value={kind} onChange={(_, value: string) => update({ kind: value === "all" ? null : value, sort: value !== "question" && sort === "unanswered" ? null : sort === "latest" ? null : sort })}
      variant="scrollable" allowScrollButtonsMobile aria-label="Thread type">
      {KINDS.map(value => <Tab key={value} value={value} label={value === "all" ? "Everything" : KIND_PLURALS[value]} />)}
    </Tabs>
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
      <ToggleButtonGroup size="small" exclusive value={sort} onChange={(_, value: string | null) => value && update({ sort: value === "latest" ? null : value, ...(value === "unanswered" ? { kind: "question" } : {}) })} aria-label="Sort">
        <ToggleButton value="latest">Latest</ToggleButton>
        <ToggleButton value="top">Most helpful</ToggleButton>
        <ToggleButton value="unanswered">Unanswered</ToggleButton>
      </ToggleButtonGroup>
      <Autocomplete size="small" options={PEPTIDE_OPTIONS} value={peptide ?? null} sx={{ width: { xs: "100%", sm: 240 } }}
        onChange={(_, option) => update({ peptide: option?.slug ?? null })}
        getOptionLabel={option => option.name} isOptionEqualToValue={(option, value) => option.slug === value.slug}
        renderInput={inputProps => <TextField {...inputProps} label="Peptide" />} />
      <Box component="form" role="search" onSubmit={event => { event.preventDefault(); update({ q: q.trim() || null }) }} sx={{ flex: { xs: "1 1 100%", sm: "1 1 220px" }, maxWidth: { sm: 320 } }}>
        <TextField size="small" type="search" label="Search titles" value={q} onChange={event => setQ(event.target.value.slice(0, 80))} fullWidth />
      </Box>
      {lot ? <Chip label={`Lot ${lot}`} onDelete={() => update({ lot: null })} color="primary" variant="outlined" /> : null}
    </Box>
  </Box>
}
