"use client"

import createCache, { type EmotionCache } from "@emotion/cache"
import { CacheProvider } from "@emotion/react"
import type { ReactNode } from "react"

const caches = new Map<string, EmotionCache>()

function cacheFor(name: string) {
  let cache = caches.get(name)
  if (cache) return cache
  cache = createCache({ key: `vetud-${name}` })
  // Same cascade as the main cache (ThemeRegistry: enableCssLayer), so these styles sit in @layer mui too.
  const insert = cache.insert
  cache.insert = (selector, serialized, sheet, shouldCache) => {
    if (!serialized.styles.startsWith("@layer")) serialized.styles = `@layer mui {${serialized.styles}}`
    return insert(selector, serialized, sheet, shouldCache)
  }
  caches.set(name, cache)
  return cache
}

/**
 * Puts the styles of a big client-only part (the 18+ entry window, the welcome pop-up) in a style
 * sheet of its own, which the browser adds in one go the first time that part appears.
 *
 * Without it, their new rules were written into MUI's shared sheet. Editing a sheet that
 * uses CSS layers makes Chrome restyle and re-lay out the whole page, and MUI's dialog reads the
 * layout as it opens, so every first visit paid for a full-page layout inside the opening script
 * (Lighthouse's "forced reflow"). A sheet that is new in that frame only touches what uses it.
 */
export default function OwnStyleSheet({ name, children }: { name: string, children: ReactNode }) {
  return <CacheProvider value={cacheFor(name)}>{children}</CacheProvider>
}
