"use client"

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"
import { useState } from "react"
import { useContentTranslator } from "@/i18n/use-content-translator"

/**
 * Share a guide or article (owner, 2026-11-27). Plain links, no Facebook or X scripts: nothing is
 * sent to those services unless the reader clicks, so no cookies and no consent prompt are needed.
 */
export default function ShareLinks({ url, title }: { url: string; title: string }) {
  const ct = useContentTranslator()
  const [copied, setCopied] = useState(false)
  const link = encodeURIComponent(url)
  const targets = [
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${link}` },
    { label: "X", href: `https://x.com/intent/post?url=${link}&text=${encodeURIComponent(title)}` },
    { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
  ]
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard blocked: the address bar still has the link.
    }
  }
  const buttonSx = { minHeight: 44, textTransform: "none", fontWeight: 600 } as const

  return (
    <Box
      component="nav"
      aria-label={ct("Share this page")}
      sx={{ mt: 3, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}
    >
      <Typography component="span" sx={{ fontSize: 14, fontWeight: 700, color: "brand.navy", mr: 0.5 }}>
        {ct("Share")}
      </Typography>
      {targets.map((target) => (
        <Button
          key={target.label}
          component="a"
          href={target.href}
          target="_blank"
          rel="noopener noreferrer"
          variant="outlined"
          size="small"
          sx={buttonSx}
          aria-label={ct.template(
            "Share on {v0} (opens in a new tab)",
            { v0: target.label },
            { translateValues: false },
          )}
        >
          {target.label}
        </Button>
      ))}
      <Button variant="outlined" size="small" onClick={() => void copy()} sx={buttonSx} aria-live="polite">
        {ct(copied ? "Link copied" : "Copy link")}
      </Button>
    </Box>
  )
}
