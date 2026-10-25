const fs = require("node:fs")

async function main() {
  const ids = ["78QUeXVKiJ4", "nv2kfBFkv4s"]
  const videos = await Promise.all(ids.map(async id => {
    const watchUrl = `https://www.youtube.com/watch?v=${id}`
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`)
    if (!response.ok) throw new Error(`Video ${id}: ${response.status}`)
    const metadata = await response.json()
    if (metadata.author_name !== "Khan Academy" || !metadata.html.includes(`/embed/${id}`)) throw new Error(`Unexpected creator or unavailable embed: ${id}`)
    const thumbnail = await fetch(metadata.thumbnail_url)
    if (!thumbnail.ok) throw new Error(`Thumbnail ${id}: ${thumbnail.status}`)
    return { id, watchUrl, title: metadata.title, creator: metadata.author_name, channel: metadata.author_url, thumbnail: metadata.thumbnail_url, embedAvailable: true }
  }))
  fs.writeFileSync("output/qa/peptide-video-sources.json", JSON.stringify(videos, null, 2))
  console.log(JSON.stringify(videos, null, 2))
}

main().catch(error => { console.error(error); process.exit(1) })
