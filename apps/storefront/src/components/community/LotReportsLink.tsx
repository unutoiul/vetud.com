"use client"

import Typography from "@mui/material/Typography"
import { useEffect, useState } from "react"
import { sdk } from "@/lib/medusa/sdk"
import { AppLink } from "../common/links"

/** "3 member reports on this lot" (or a prompt to add one), for the lot lookup result. */
export default function LotReportsLink({ lot }: { lot: string }) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    sdk.client.fetch<{ counts: Record<string, number> }>("/store/forum/lot-counts", { query: { lots: lot } })
      .then(({ counts }) => { if (!cancelled) setCount(counts[lot] ?? 0) })
      .catch(() => { if (!cancelled) setCount(null) })
    return () => { cancelled = true }
  }, [lot])

  if (count === null) return null
  return <Typography variant="body2" sx={{ mt: 0.5 }}>
    {count
      ? <AppLink href={`/community?lot=${encodeURIComponent(lot)}`}>{count} member {count === 1 ? "report" : "reports"} on this lot</AppLink>
      : <AppLink href={`/community/new?lot=${encodeURIComponent(lot)}`}>Be the first to report on this lot</AppLink>}
  </Typography>
}
