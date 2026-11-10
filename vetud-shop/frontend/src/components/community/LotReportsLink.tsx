"use client"
import { useTranslations } from "next-intl"

import Typography from "@mui/material/Typography"
import { useEffect, useState } from "react"
import { sdk } from "@/lib/medusa/sdk"
import { AppLink } from "../common/links"

/** "3 member reports on this lot", for the lot lookup result. Nothing when there are none. */
export default function LotReportsLink({ lot }: { lot: string }) {
  const act = useTranslations("Actions")
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    sdk.client.fetch<{ counts: Record<string, number> }>("/store/forum/lot-counts", { query: { lots: lot } })
      .then(({ counts }) => { if (!cancelled) setCount(counts[lot] ?? 0) })
      .catch(() => { if (!cancelled) setCount(null) })
    return () => { cancelled = true }
  }, [lot])

  // Posts no longer name lots, so only lots with earlier reports link anywhere.
  if (!count) return null
  return <Typography variant="body2" sx={{ mt: 0.5 }}>
    <AppLink href={`/community?lot=${encodeURIComponent(lot)}`}>{act("memberReports", { count })}</AppLink>
  </Typography>
}
