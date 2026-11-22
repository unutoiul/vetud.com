import "server-only"
import type { NextRequest } from "next/server"

const buckets = new Map<string, number[]>()

/**
 * A simple per-IP limit, per server instance: enough to stop casual form spam. Returns true when the
 * caller is over `max` requests in `windowMs` for this `name`.
 */
export function limited(request: NextRequest, name: string, max: number, windowMs: number) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const key = `${name}:${ip}`
  const now = Date.now()
  const hits = (buckets.get(key) ?? []).filter((time) => now - time < windowMs)
  hits.push(now)
  buckets.set(key, hits)
  if (buckets.size > 10000) buckets.clear()
  return hits.length > max
}
