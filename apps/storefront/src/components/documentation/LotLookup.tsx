"use client"

import type { HttpTypes } from "@medusajs/types"
import { SearchIcon as ManageSearchIcon, ShieldIcon as VerifiedOutlinedIcon } from "@/components/brand/Icon"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { sdk } from "@/lib/medusa/sdk"
import { parseLots, readProductMeta, type ProductLot } from "@/lib/product"
import { AppLink } from "../common/links"
import ProductThumb from "../product/ProductThumb"

type Match = { product: HttpTypes.StoreProduct; lot: ProductLot }

/** Finds products whose documented lots include an exact (case-insensitive) match. */
async function findLot(lot: string): Promise<Match[]> {
  const { products } = await sdk.client.fetch<{ products: HttpTypes.StoreProduct[] }>(
    "/store/meilisearch/products",
    { query: { query: lot, limit: 10, fields: "id,title,handle,thumbnail,+metadata,*categories" } }
  )
  return products.flatMap((product) =>
    parseLots(product.metadata?.lots)
      .filter((entry) => entry.lot.toUpperCase() === lot)
      .map((entry) => ({ product, lot: entry }))
  )
}

const normalize = (raw: string) => raw.trim().toUpperCase()

export default function LotLookup() {
  const searchParams = useSearchParams()
  const initial = normalize(searchParams.get("lot") ?? "")
  const [value, setValue] = useState(initial)
  const [searched, setSearched] = useState<string | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(Boolean(initial))
  const [failed, setFailed] = useState(false)

  const settle = useCallback((lot: string, found: Match[] | null) => {
    setMatches(found ?? [])
    setFailed(found === null)
    setSearched(lot)
    setLoading(false)
  }, [])

  // A link like /documentation?lot=VTD01-2609A runs the lookup on arrival.
  useEffect(() => {
    if (!initial) return
    let cancelled = false
    findLot(initial)
      .then((found) => !cancelled && settle(initial, found))
      .catch(() => !cancelled && settle(initial, null))
    return () => {
      cancelled = true
    }
  }, [initial, settle])

  const lookup = async (raw: string) => {
    const lot = normalize(raw)
    if (!lot) return
    setLoading(true)
    try {
      settle(lot, await findLot(lot))
    } catch {
      settle(lot, null)
    }
  }

  return (
    <Box>
      <Stack
        component="form"
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ maxWidth: 640 }}
        onSubmit={(event) => {
          event.preventDefault()
          lookup(value)
        }}
      >
        <TextField
          label="Lot number"
          placeholder="e.g. VTD01-2609A…"
          name="lot"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          slotProps={{ htmlInput: { autoComplete: "off", autoCapitalize: "characters", spellCheck: false } }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ManageSearchIcon />}
          sx={{ flexShrink: 0, minHeight: 56 }}
        >
          Look up lot
        </Button>
      </Stack>

      <Box aria-live="polite" sx={{ mt: 3 }}>
        {failed ? <Alert severity="error">Lookup is unavailable right now. Please try again shortly.</Alert> : null}
        {!failed && searched && !loading && !matches.length ? (
          <Alert severity="info">
            No documented lot matches <strong>{searched}</strong>. Check the label for typos, or{" "}
            <AppLink href={`/contact?subject=${encodeURIComponent(`Lot enquiry: ${searched}`)}`}>contact us</AppLink> with a photo of the label.
          </Alert>
        ) : null}
        <Grid container spacing={2}>
          {matches.map(({ product, lot }) => {
            const meta = readProductMeta(product)
            return (
              <Grid key={`${product.id}-${lot.lot}`} size={{ xs: 12, md: 8 }}>
                <Paper variant="outlined" sx={{ p: 3, display: "flex", gap: 2.5, alignItems: "center", bgcolor: "#f7f9fa", borderRadius: 3 }}>
                  <Box sx={{ width: 120, flexShrink: 0, display: { xs: "none", sm: "block" } }}>
                    <ProductThumb image={product.thumbnail} meta={meta} sizes="120px" />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "success.main" }}>
                      <VerifiedOutlinedIcon fontSize="small" />
                      <Typography variant="eyebrow">Documented lot</Typography>
                    </Stack>
                    <Typography sx={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 20, fontWeight: 500, mt: 0.5 }}>
                      {lot.lot}
                    </Typography>
                    <Typography sx={{ mt: 0.5 }}>
                      <AppLink href={`/products/${product.handle}`}>{product.title}</AppLink> · {meta.code}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                      Batch {lot.date ?? "—"} · Purity {lot.purity ?? "—"} ·{" "}
                      {lot.coaUrl ? (
                        <a href={lot.coaUrl} target="_blank" rel="noopener">
                          Download COA
                        </a>
                      ) : (
                        <AppLink href={`/contact?subject=${encodeURIComponent(`COA request: ${lot.lot}`)}`}>Request COA</AppLink>
                      )}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            )
          })}
        </Grid>
      </Box>
    </Box>
  )
}
