"use client"

import Box from "@mui/material/Box"
import { useState } from "react"
import { useStore } from "../store/StoreProvider"

/**
 * Tells screen readers when the cart count changes; the header badge alone is silent.
 * Rendered in the header and inside the cart drawer, because an open drawer hides the rest of the page.
 * The first count after mounting is recorded, not announced.
 */
export default function CartAnnouncer() {
  const { itemCount, cartReady } = useStore()
  const [seen, setSeen] = useState<number | null>(null)
  const [message, setMessage] = useState("")
  if (cartReady && seen !== itemCount) {
    if (seen !== null) setMessage(`Cart updated: ${itemCount} item${itemCount === 1 ? "" : "s"}`)
    setSeen(itemCount)
  }
  return (
    <Box component="span" role="status" sx={{ position: "absolute", top: 0, left: 0, width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap" }}>
      {message}
    </Box>
  )
}
