"use client"

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"
import { useState } from "react"
import { useContentTranslator } from "@/i18n/use-content-translator"

/** Member text is plain: paragraphs and line breaks only, rendered as text (never HTML). */
export default function PostBody({ body, size = 16, color = "brand.ink" }: { body: string; size?: number; color?: string }) {
  const ct = useContentTranslator()
  const [showOriginal, setShowOriginal] = useState(false)
  const translation = ct.has(body) ? ct(body) : body
  const translated = translation.trim() !== body.trim()
  const display = showOriginal ? body : translation
  return <>
    <Box sx={{ fontSize: size, lineHeight: 1.75, color, overflowWrap: "anywhere", "& p": { m: 0, whiteSpace: "pre-wrap" }, "& p + p": { mt: 1.75 } }}>
      {display.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
    </Box>
    {translated ? <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", mt: 1 }}>
      <Typography component="span" sx={{ color: "text.secondary", fontSize: 12 }}>{ct("Translated from the original post.")}</Typography>
      <Button size="small" onClick={() => setShowOriginal(value => !value)} aria-pressed={showOriginal}>{ct(showOriginal ? "Show translation" : "Show original")}</Button>
    </Box> : null}
  </>
}
