import { useTranslations } from "next-intl"
import Box from "@mui/material/Box"
import Image from "next/image"
import type { ForumImage } from "@/lib/community/types"

/** A post's photos; each opens full size in a new tab. Already resized by the backend, so served as-is. */
export default function PostImages({ images, author }: { images: ForumImage[]; author: string }) {
  const act = useTranslations("Actions")
  if (!images.length) return null
  return <Box component="ul" aria-label={act("photos")} sx={{ listStyle: "none", m: 0, mt: 1.75, p: 0, display: "grid", gap: 1, gridTemplateColumns: images.length === 1 ? "minmax(0, 480px)" : "repeat(auto-fill, minmax(150px, 1fr))", maxWidth: 640 }}>
    {images.map((image, index) => <li key={image.id}>
      <Box component="a" href={image.url} target="_blank" rel="noopener noreferrer" aria-label={act("photoOpen", { number: index + 1, author: author })}
        sx={{ display: "block", position: "relative", aspectRatio: images.length === 1 ? "4 / 3" : "1 / 1", borderRadius: "8px", overflow: "hidden", border: "1px solid", borderColor: "divider", bgcolor: "brand.mintWash", "&:focus-visible": { outline: "2px solid", outlineColor: "brand.blue", outlineOffset: 2 } }}>
        <Image src={image.url} alt={`Photo ${index + 1} from ${author}`} fill unoptimized sizes="(max-width: 600px) 50vw, 240px" style={{ objectFit: "cover" }} />
      </Box>
    </li>)}
  </Box>
}
