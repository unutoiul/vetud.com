"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"


import { useTranslations } from "next-intl"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import IconButton from "@mui/material/IconButton"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import { useRef, useState } from "react"
import type { ForumImage } from "@/lib/community/types"
import { sdk } from "@/lib/medusa/sdk"
import Icon from "../brand/Icon"
import { forumError } from "./useCommunityProfile"

// Same limits as the backend (vetud-education/backend/src/api/forum-middlewares.ts).
export const MAX_POST_IMAGES = 4
const MAX_MB = 10
const ACCEPT = "image/jpeg,image/png,image/webp"

/**
 * Photos for a post, uploaded as soon as they're picked. The post sends back the upload IDs; the
 * backend strips location data and resizes each photo.
 */
export default function ImagePicker({ images, onChange, disabled = false }: { images: ForumImage[]; onChange: (images: ForumImage[]) => void; disabled?: boolean }) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const room = MAX_POST_IMAGES - images.length

  const upload = async (list: FileList | null) => {
    const files = Array.from(list ?? [])
    if (input.current) input.current.value = ""
    if (!files.length) return
    if (files.length > room) return setError(`You can add up to ${MAX_POST_IMAGES} photos to a post.`)
    if (files.some(file => file.size > MAX_MB * 1024 * 1024)) return setError(`Each photo can be up to ${MAX_MB} MB.`)
    const form = new FormData()
    files.forEach(file => form.append("files", file))
    setUploading(files.length)
    setError(null)
    try {
      const { images: added } = await sdk.client.fetch<{ images: ForumImage[] }>("/store/forum/uploads", {
        method: "POST",
        // Let the browser set the multipart boundary.
        headers: { "content-type": null },
        body: form,
      })
      onChange([...images, ...added])
    } catch (caught) {
      setError(forumError(caught, "We couldn't upload your photos. Please try again."))
    } finally {
      setUploading(0)
    }
  }

  return <Box>
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
      {images.map((image, index) => <Box key={image.id} sx={{ position: "relative", width: 96, height: 96, borderRadius: "8px", overflow: "hidden", border: "1px solid", borderColor: "divider", bgcolor: "brand.mintWash" }}>
        <Image src={image.url} alt={ct.template("Photo {v0}", { v0: index + 1 })} fill sizes="96px" unoptimized style={{ objectFit: "cover" }} />
        <IconButton size="small" aria-label={act("removePhoto", { number: index + 1 })} onClick={() => onChange(images.filter(entry => entry.id !== image.id))} disabled={disabled}
          sx={{ position: "absolute", top: 4, right: 4, bgcolor: "rgba(255,255,255,.92)", "&:hover": { bgcolor: "#fff" } }}>
          <Icon name="close" sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>)}
      {Array.from({ length: uploading }, (_, index) => <Box key={`uploading-${index}`} role="status" aria-label={act("uploadingPhoto")}
        sx={{ width: 96, height: 96, borderRadius: "8px", border: "1px dashed", borderColor: "divider", display: "grid", placeItems: "center" }}><CircularProgress size={22} /></Box>)}
      {room > 0 && !uploading ? <Button variant="outlined" onClick={() => input.current?.click()} disabled={disabled} startIcon={<Icon name="plus" sx={{ fontSize: 18 }} />}>
        {ct(images.length ? act("addPhotos") : act("addPhotos"))}
      </Button> : null}
      <input ref={input} type="file" accept={ACCEPT} multiple hidden onChange={event => void upload(event.target.files)} />
    </Box>
    <Typography sx={{ mt: 1, fontSize: 12.5, color: "brand.navySoft", lineHeight: 1.6 }}>{ct.rich("Optional · up to {v0} photos (JPEG, PNG or WebP, {v1} MB each). Location data is removed. Don't show dose labels, faces or anything that identifies you. New members' photos are checked by a moderator first.", { v0: ct(MAX_POST_IMAGES), v1: ct(MAX_MB) }, {  })}</Typography>
    {error ? <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setError(null)}>{ct(error)}</Alert> : null}
  </Box>
}
