"use client"

import type { HttpTypes } from "@medusajs/types"
import Alert from "@mui/material/Alert"
import Autocomplete from "@mui/material/Autocomplete"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Checkbox from "@mui/material/Checkbox"
import Chip from "@mui/material/Chip"
import CircularProgress from "@mui/material/CircularProgress"
import FormControlLabel from "@mui/material/FormControlLabel"
import MenuItem from "@mui/material/MenuItem"
import Skeleton from "@mui/material/Skeleton"
import TextField from "@mui/material/TextField"
import ToggleButton from "@mui/material/ToggleButton"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import Typography from "@mui/material/Typography"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState, type FormEvent } from "react"
import { getPeptide, PEPTIDES } from "@/content/learn/peptides"
import { revalidateCommunity } from "@/lib/community/actions"
import { findDose, KIND_LABELS } from "@/lib/community/format"
import { CATEGORY_METRICS, METRIC_IDS, METRICS, toCanonical, unitLabel, type MetricId, type UnitSystem } from "@/lib/community/metrics"
import type { ForumThreadDetail, ThreadKind } from "@/lib/community/types"
import { sdk } from "@/lib/medusa/sdk"
import { parseLots } from "@/lib/product"
import { AuthPanel } from "../account/AccountPage"
import { useLocalizedHref } from "../common/links"
import { useCountryCode } from "../store/StoreProvider"
import JoinCommunity from "./JoinCommunity"
import { forumError, useCommunityProfile } from "./useCommunityProfile"

const KINDS: { value: ThreadKind; hint: string }[] = [
  { value: "research_log", hint: "Track measurements over time. Logs add up into the community charts." },
  { value: "question", hint: "Ask the community and experts. You can mark the best answer." },
  { value: "discussion", hint: "Talk about a study, a lot, storage or anything else." },
]

const SIDE_EFFECTS = ["None noticed", "Nausea", "Headache", "Tiredness", "Poor sleep", "Dizziness", "Injection-site redness", "Increased hunger", "Reduced appetite", "Flushing"]

type ProductOption = { handle: string; title: string; lots: string[] }
type MetricEntry = { start: string; now: string }

const PEPTIDE_OPTIONS = [...PEPTIDES].sort((a, b) => a.name.localeCompare(b.name))
const number = (raw: string) => Number(raw.replace(",", ".").trim())

/** Start a research log, question or discussion. Signs the member in and creates their profile first if needed. */
export default function Composer() {
  const router = useRouter()
  const params = useSearchParams()
  const localize = useLocalizedHref()
  const countryCode = useCountryCode()
  const community = useCommunityProfile()

  const initialKind = KINDS.some(kind => kind.value === params.get("kind")) ? params.get("kind") as ThreadKind : "research_log"
  const initialPeptide = getPeptide(params.get("peptide") ?? "")?.slug ?? null
  const [kind, setKind] = useState<ThreadKind>(initialKind)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [peptide, setPeptide] = useState<string | null>(initialPeptide)
  const [others, setOthers] = useState<string[]>([])
  const [products, setProducts] = useState<ProductOption[] | null>(null)
  const [product, setProduct] = useState("")
  const [lot, setLot] = useState(params.get("lot")?.toUpperCase() ?? "")
  const [units, setUnits] = useState<UnitSystem>(countryCode === "us" ? "imperial" : "metric")
  // Null until the member picks their own measures; until then, the ones that fit the peptide.
  const [chosenMetrics, setChosenMetrics] = useState<MetricId[] | null>(null)
  const [values, setValues] = useState<Partial<Record<MetricId, MetricEntry>>>({})
  const [weeks, setWeeks] = useState("")
  const [sideEffects, setSideEffects] = useState<string[]>([])
  const [consent, setConsent] = useState(false)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isLog = kind === "research_log"
  const category = peptide ? getPeptide(peptide)?.category : undefined
  const suggested = useMemo(() => category ? CATEGORY_METRICS[category] : ["body_weight", "energy", "sleep_quality"] as MetricId[], [category])
  const metrics = chosenMetrics ?? suggested.slice(0, 2)
  const dose = findDose([title, body, ...sideEffects].join("\n"))
  const selectedProduct = products?.find(option => option.handle === product)

  // A lot from the documentation page (?lot=) preselects its product once the catalog loads.
  const [linkedLot] = useState(lot)
  useEffect(() => {
    let cancelled = false
    sdk.store.product.list({ fields: "handle,title,+metadata", limit: 100 })
      .then(({ products: list }: { products: HttpTypes.StoreProduct[] }) => {
        if (cancelled) return
        const options: ProductOption[] = list.flatMap(item => item.handle
          ? [{ handle: item.handle, title: item.title, lots: parseLots(item.metadata?.lots).map(entry => entry.lot) }]
          : [])
        setProducts(options.sort((a, b) => a.title.localeCompare(b.title)))
        const fromLot = linkedLot ? options.find(option => option.lots.includes(linkedLot)) : undefined
        if (fromLot) setProduct(fromLot.handle)
      })
      .catch(() => { if (!cancelled) setProducts([]) })
    return () => { cancelled = true }
  }, [linkedLot])

  if (community.loading) return <Skeleton variant="rounded" height={420} />
  if (!community.signedIn) {
    return <Box>
      <Typography sx={{ mb: 2.5, fontSize: 16, color: "brand.navySoft", lineHeight: 1.7, maxWidth: 560 }}>Sign in or create a Vetud account to post. Reading the community is open to everyone.</Typography>
      <AuthPanel />
    </Box>
  }
  if (!community.profile) return <JoinCommunity suggested={community.suggested} onJoined={community.setProfile} />
  if (community.profile.status !== "active") return <Alert severity="info">Your community account can&apos;t post right now. Contact us if you think this is a mistake.</Alert>

  const toggleMetric = (metric: MetricId) =>
    setChosenMetrics(metrics.includes(metric) ? metrics.filter(entry => entry !== metric) : [...metrics, metric])

  const setValue = (metric: MetricId, field: keyof MetricEntry, raw: string) =>
    setValues(current => ({ ...current, [metric]: { start: "", now: "", ...current[metric], [field]: raw.replace(/[^\d.,]/g, "").slice(0, 7) } }))

  const measurements = () => {
    const week = Number(weeks || 0)
    return metrics.flatMap(metric => {
      const entry = values[metric]
      if (!entry?.start) return []
      const start = { metric, week: 0, value: toCanonical(metric, number(entry.start), units) }
      return entry.now && week > 0 ? [start, { metric, week, value: toCanonical(metric, number(entry.now), units) }] : [start]
    })
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (isLog && !peptide) return setError("Choose the peptide this log is about.")
    const entries = isLog ? measurements() : []
    if (isLog && !entries.length) return setError("Add a starting value for at least one measurement.")
    if (entries.some(entry => !Number.isFinite(entry.value))) return setError("Please enter numbers only in the measurements.")
    if (isLog && metrics.some(metric => values[metric]?.now && !Number(weeks))) return setError("Enter how many weeks ago you started, so your current values are placed correctly.")
    if (isLog && !consent) return setError("Please confirm that your log can be published.")

    setPosting(true)
    try {
      const detail = await sdk.client.fetch<ForumThreadDetail>("/store/forum/threads", {
        method: "POST",
        body: {
          kind,
          title: title.trim(),
          body: body.trim(),
          peptide,
          ...(isLog ? { other_peptides: others, unit_system: units, side_effects: sideEffects, measurements: entries, consent } : {}),
          product: product || null,
          lot: product && lot ? lot : null,
        },
      })
      await revalidateCommunity(detail.thread.id)
      router.push(localize(`/community/${detail.thread.id}`))
    } catch (caught) {
      setError(forumError(caught, "We couldn't post your thread. Please try again."))
      setPosting(false)
    }
  }

  return <Box component="form" noValidate onSubmit={submit} aria-busy={posting} sx={{ display: "grid", gap: 3.5 }}>
    <Box>
      <Typography component="h2" sx={{ fontSize: 15, fontWeight: 650, mb: 1.25 }}>What are you posting?</Typography>
      <Box role="radiogroup" aria-label="Thread type" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 1.5 }}>
        {KINDS.map(option => {
          const selected = option.value === kind
          return <Box key={option.value} component="button" type="button" role="radio" aria-checked={selected} onClick={() => setKind(option.value)}
            sx={{ textAlign: "left", font: "inherit", cursor: "pointer", p: 2, borderRadius: "10px", border: "2px solid", borderColor: selected ? "brand.blue" : "divider", bgcolor: selected ? "brand.mintWash" : "#fff", color: "inherit", "&:focus-visible": { outline: "2px solid", outlineColor: "brand.blue", outlineOffset: 2 } }}>
            <Typography sx={{ fontWeight: 700, color: "brand.navy" }}>{KIND_LABELS[option.value]}</Typography>
            <Typography sx={{ mt: .5, fontSize: 13.5, color: "brand.navySoft", lineHeight: 1.55 }}>{option.hint}</Typography>
          </Box>
        })}
      </Box>
    </Box>

    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: isLog ? "1fr 1fr" : "1fr" }, gap: 2 }}>
      <Autocomplete options={PEPTIDE_OPTIONS} value={PEPTIDE_OPTIONS.find(option => option.slug === peptide) ?? null}
        onChange={(_, option) => { setPeptide(option?.slug ?? null); setOthers(current => current.filter(slug => slug !== option?.slug)) }}
        getOptionLabel={option => option.name} isOptionEqualToValue={(option, value) => option.slug === value.slug}
        renderInput={inputProps => <TextField {...inputProps} label={isLog ? "Peptide" : "Peptide (optional)"} required={isLog} helperText={isLog ? "The main peptide this log is about." : "Helps others find your thread."} />} />
      {isLog ? <Autocomplete multiple options={PEPTIDE_OPTIONS.filter(option => option.slug !== peptide)} value={PEPTIDE_OPTIONS.filter(option => others.includes(option.slug))}
        onChange={(_, options) => setOthers(options.slice(0, 5).map(option => option.slug))}
        getOptionLabel={option => option.name} isOptionEqualToValue={(option, value) => option.slug === value.slug}
        renderInput={inputProps => <TextField {...inputProps} label="Also used at the same time (optional)" helperText="Logs that combine peptides are marked in the charts." />} /> : null}
    </Box>

    <TextField label="Title" value={title} onChange={event => setTitle(event.target.value.slice(0, 140))} required fullWidth
      placeholder={isLog ? "e.g. BPC-157: 12 weeks of recovery notes" : kind === "question" ? "e.g. How do you store vials after opening?" : ""}
      helperText={`${title.length}/140`} slotProps={{ htmlInput: { maxLength: 140 } }} />

    {isLog ? <Box component="fieldset" sx={{ m: 0, p: { xs: 2, md: 3 }, border: "1px solid", borderColor: "divider", borderRadius: "10px", minWidth: 0 }}>
      <Box component="legend" sx={{ px: 1, fontWeight: 650 }}>Measurements</Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 2 }}>
        <Typography sx={{ fontSize: 14, color: "brand.navySoft", maxWidth: 560 }}>Choose what you track. Enter where you started and, if you&apos;ve already begun, where you are now.</Typography>
        <ToggleButtonGroup size="small" exclusive value={units} onChange={(_, value) => value && setUnits(value)} aria-label="Units">
          <ToggleButton value="metric">kg · cm</ToggleButton>
          <ToggleButton value="imperial">lb · in</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2.5 }} role="group" aria-label="Measures to track">
        {[...suggested, ...METRIC_IDS.filter(metric => !suggested.includes(metric))].map(metric => <Chip key={metric} label={METRICS[metric].label} clickable
          color={metrics.includes(metric) ? "primary" : "default"} variant={metrics.includes(metric) ? "filled" : "outlined"} onClick={() => toggleMetric(metric)} aria-pressed={metrics.includes(metric)} />)}
      </Box>
      {metrics.length ? <>
        <TextField label="Weeks since you started" value={weeks} onChange={event => setWeeks(event.target.value.replace(/\D/g, "").slice(0, 3))} sx={{ mb: 2, maxWidth: 260 }}
          helperText="Leave empty if you're starting today." slotProps={{ htmlInput: { inputMode: "numeric" } }} />
        <Box sx={{ display: "grid", gap: 1.5 }}>
          {metrics.map(metric => <Box key={metric} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "220px 1fr 1fr" }, gap: 1.5, alignItems: "start" }}>
            <Box sx={{ gridColumn: { xs: "1 / -1", md: "auto" }, pt: { md: 1.5 } }}>
              <Typography sx={{ fontWeight: 650, fontSize: 15 }}>{METRICS[metric].label} <Box component="span" sx={{ fontWeight: 400, color: "brand.navySoft" }}>({unitLabel(metric, units)})</Box></Typography>
              {METRICS[metric].hint ? <Typography sx={{ fontSize: 12.5, color: "brand.navySoft" }}>{METRICS[metric].hint}</Typography> : null}
            </Box>
            <TextField size="small" label="At the start" value={values[metric]?.start ?? ""} onChange={event => setValue(metric, "start", event.target.value)} slotProps={{ htmlInput: { inputMode: "decimal" } }} />
            <TextField size="small" label="Now" value={values[metric]?.now ?? ""} onChange={event => setValue(metric, "now", event.target.value)} disabled={!Number(weeks)} slotProps={{ htmlInput: { inputMode: "decimal" } }} />
          </Box>)}
        </Box>
      </> : null}
      <Autocomplete multiple freeSolo options={SIDE_EFFECTS} value={sideEffects} sx={{ mt: 2.5 }}
        onChange={(_, list) => setSideEffects(list.map(entry => entry.trim().slice(0, 60)).filter(Boolean).slice(0, 12))}
        renderInput={inputProps => <TextField {...inputProps} label="Side effects noticed (optional)" helperText="Pick from the list or type your own and press Enter." />} />
    </Box> : null}

    <TextField label={isLog ? "Notes" : kind === "question" ? "Your question" : "What would you like to discuss?"} value={body} onChange={event => setBody(event.target.value.slice(0, 10000))} required multiline minRows={6} fullWidth
      helperText={isLog ? "How you track, what changed, anything that affects the numbers (diet, training, sleep). No doses." : "Plain text. Links from new members are checked by a moderator first."} />

    <Box component="details" open={Boolean(product)} sx={{ "& summary": { cursor: "pointer", fontWeight: 600, color: "brand.blue", minHeight: 44, display: "flex", alignItems: "center" } }}>
      <summary>Link a Vetud product and lot (optional)</summary>
      <Box sx={{ mt: 1.5, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
        <TextField select label="Product" value={product} onChange={event => { setProduct(event.target.value); setLot("") }} disabled={!products} helperText="Members with a paid order for it get a Verified buyer badge.">
          <MenuItem value="">No product</MenuItem>
          {(products ?? []).map(option => <MenuItem key={option.handle} value={option.handle}>{option.title}</MenuItem>)}
        </TextField>
        <TextField select label="Lot number" value={selectedProduct?.lots.includes(lot) ? lot : ""} onChange={event => setLot(event.target.value)} disabled={!selectedProduct?.lots.length}
          helperText={selectedProduct && !selectedProduct.lots.length ? "No lots are published for this product yet." : "As printed on your packaging. Your post appears with the lot's batch record."}>
          <MenuItem value="">Not specified</MenuItem>
          {(selectedProduct?.lots ?? []).map(entry => <MenuItem key={entry} value={entry}>{entry}</MenuItem>)}
        </TextField>
      </Box>
    </Box>

    {dose ? <Alert severity="warning">“{dose}” looks like a dose amount. The community doesn&apos;t share doses or protocols, so posts with them wait for a moderator. Remove it to publish straight away.</Alert> : null}

    {isLog ? <FormControlLabel control={<Checkbox checked={consent} onChange={event => setConsent(event.target.checked)} />}
      label={<Typography sx={{ fontSize: 14.5, lineHeight: 1.6 }}>I agree that this log, including its health measurements, is published under my community name and may be included, without my name, in the community charts.</Typography>} sx={{ alignItems: "flex-start", "& .MuiCheckbox-root": { mt: -.75 } }} /> : null}

    {error ? <Alert severity="error" onClose={() => setError(null)}>{error}</Alert> : null}

    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
      <Button type="submit" variant="contained" size="large" disabled={posting || title.trim().length < 8 || body.trim().length < 20}
        startIcon={posting ? <CircularProgress size={16} color="inherit" /> : null}>
        {posting ? "Posting…" : `Post ${KIND_LABELS[kind].toLowerCase()}`}
      </Button>
      <Typography sx={{ fontSize: 13.5, color: "brand.navySoft" }}>Posting as {community.profile.display_name}. Titles need 8 characters and the text 20.</Typography>
    </Box>
  </Box>
}
