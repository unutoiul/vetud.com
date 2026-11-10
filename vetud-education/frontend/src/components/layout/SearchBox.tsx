"use client"

import Icon, { SearchIcon } from "@/components/brand/Icon"
import Autocomplete from "@mui/material/Autocomplete"
import Box from "@mui/material/Box"
import CircularProgress from "@mui/material/CircularProgress"
import InputAdornment from "@mui/material/InputAdornment"
import type { PopperProps } from "@mui/material/Popper"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState, type ReactNode, type Ref } from "react"
import { formatArticleDate } from "@/content/learn/articles"
import { translateAction } from "@/i18n/actions"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { loadSearchIndex, rank, type ArticleEntry, type GuideEntry } from "@/lib/site-search"
import { useLanguage } from "../common/language"

/** One result; the groups always appear in this order. */
type Result =
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

/** Searches the peptide guides and the news, in the browser, grouped by kind. */
export default function SearchBox({ autoFocus, inputRef, onNavigate, dense, inline }: SearchBoxProps) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const router = useRouter()
  const language = useLanguage()
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
      const index = await loadSearchIndex().catch(() => ({ guides: [], articles: [] }))
      if (requestId !== latest.current) return
      const guides = rank(index.guides, query, (guide) => [ct(guide.name), [guide.aka ?? "", guide.slug], [ct(guide.category), ct(guide.line), ct(guide.about), guide.name, guide.line]], 6)
      const articles = rank(index.articles, query, (article) => [ct(article.title), [ct(article.kind), ...article.peptides], [ct(article.dek), article.title, article.dek]], 6)
      setOptions([
        ...guides.map((guide): Result => ({ group: "Peptide guides", key: `g-${guide.slug}`, label: guide.name, href: `/learn/${guide.slug}`, guide })),
        ...articles.map((article): Result => ({ group: "News & articles", key: `a-${article.slug}`, label: article.title, href: `/news/${article.slug}`, article })),
      ])
      setLoading(false)
    }, 220)
  }

  const go = (path: string) => {
    router.push(`/${language}${path}`)
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
        if (value && typeof value !== "string") go(value.href)
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
          <Box component="ul" sx={{ p: 0 }}>{params.children}</Box>
        </Box>
      )}
      renderOption={(props, option) => {
        const { key, ...rest } = props as typeof props & { key: string }
        return (
          <Box component="li" key={key} {...rest} sx={{ gap: 1.5, alignItems: "center !important", py: "8px !important", minHeight: 60 }}>
            {option.group === "Peptide guides"
              ? <ContentRow icon="molecule" title={ct(option.guide.name)} detail={option.guide.aka ? `${option.guide.aka} · ${ct(option.guide.line)}` : ct(option.guide.line)} />
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
              "aria-label": ct("Search peptide guides and news"),
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

function ContentRow({ icon, title, detail }: { icon: "molecule" | "news"; title: string; detail: string }) {
  return <>
    <Box aria-hidden sx={{ width: 48, height: 48, flexShrink: 0, borderRadius: "8px", display: "grid", placeItems: "center", bgcolor: "brand.mintWash", color: "brand.blue" }}>
      <Icon name={icon} sx={{ fontSize: 22 }} />
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>{title}</Typography>
      <Typography sx={{ color: "text.secondary", fontSize: 12, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{detail}</Typography>
    </Box>
  </>
}
