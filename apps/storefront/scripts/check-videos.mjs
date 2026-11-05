import { readFile } from "node:fs/promises"

// Checks every curated video with YouTube oEmbed: it must still exist, allow embedding and keep
// its channel. Run with `node scripts/check-videos.mjs`; it exits with 1 if any video fails.
const source = await readFile(new URL("../src/content/learn/videos.ts", import.meta.url), "utf8")
const videos = [...source.matchAll(/\{ id: "([\w-]{11})", title: "([^"]+)", creator: "([^"]+)"/g)].map(([, id, title, creator]) => ({ id, title, creator }))

let failed = 0
for (const video of videos) {
  const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${video.id}&format=json`).catch(() => null)
  if (!response?.ok) {
    failed++
    console.log(`FAIL ${video.id} ${video.title}: ${response ? `HTTP ${response.status} (removed, private or not embeddable)` : "no response"}`)
    continue
  }
  const { author_name: channel } = await response.json()
  console.log(`ok   ${video.id} ${channel}`)
}
console.log(`${videos.length - failed} of ${videos.length} videos are available.`)
process.exit(failed ? 1 : 0)
