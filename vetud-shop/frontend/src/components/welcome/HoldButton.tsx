"use client"

import Box from "@mui/material/Box"
import Button, { type ButtonProps } from "@mui/material/Button"
import { keyframes, type SxProps, type Theme } from "@mui/material/styles"
import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react"
import { useContentTranslator } from "@/i18n/use-content-translator"

/** How long a splash button has to be held before it acts. */
export const HOLD_MS = 3000
const SECONDS = Math.round(HOLD_MS / 1000)

const isHoldKey = (key: string) => key === " " || key === "Enter"

// Two mirrored shakes (distinct names): switching between them replays it on every early release.
const nudges = [
  keyframes`
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-4px); }
    40%, 80% { transform: translateX(4px); }
  `,
  keyframes`
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(4px); }
    40%, 80% { transform: translateX(-4px); }
  `,
]

type HoldButtonProps = Omit<ButtonProps, "onClick" | "href" | "type" | "endIcon"> & {
  /** Runs once the button has been held for HOLD_MS. */
  onConfirm: () => void
  /** Colour of the bar that fills the button while it is held. */
  fill: string
  /** "full" shows "Hold 3s" before the hold starts; "short" shows only "3s", for small buttons. */
  hint?: "full" | "short"
  /** Extra styles for the counter, e.g. to push it to the button's edge. */
  counterSx?: SxProps<Theme>
}

/**
 * A button that acts only after a three-second hold: a bar fills the button and a counter in it
 * counts the seconds down. Letting go early empties the bar. Works with a mouse, touch, and the
 * keyboard (hold Space or Enter). Screen readers activate buttons with a plain click, which no
 * press starts, so that click still acts at once.
 */
export default function HoldButton({ onConfirm, fill, hint = "full", counterSx, children, disabled, sx, ...props }: HoldButtonProps) {
  const ct = useContentTranslator()
  const hintId = useId()
  const [holding, setHolding] = useState(false)
  const [left, setLeft] = useState(SECONDS)
  const [shake, setShake] = useState(0)
  const done = useRef<number | undefined>(undefined)
  const ticker = useRef<number | undefined>(undefined)
  const startedAt = useRef(0)
  // Set from press to click, so the click that ends a press never acts on its own.
  const pressed = useRef(false)
  const confirm = useRef(onConfirm)

  useEffect(() => {
    confirm.current = onConfirm
  }, [onConfirm])

  const stopTimers = () => {
    window.clearTimeout(done.current)
    window.clearInterval(ticker.current)
    done.current = undefined
  }
  useEffect(() => stopTimers, [])

  const start = () => {
    if (disabled || done.current !== undefined) return
    pressed.current = true
    startedAt.current = performance.now()
    setLeft(SECONDS)
    setHolding(true)
    ticker.current = window.setInterval(() => {
      setLeft(Math.max(1, SECONDS - Math.floor((performance.now() - startedAt.current) / 1000)))
    }, 100)
    done.current = window.setTimeout(() => {
      stopTimers()
      setHolding(false)
      setLeft(SECONDS)
      confirm.current()
    }, HOLD_MS)
  }

  const release = () => {
    if (done.current === undefined) return
    stopTimers()
    setHolding(false)
    setLeft(SECONDS)
    setShake((count) => count + 1)
  }

  return (
    <Button
      {...props}
      type="button"
      disabled={disabled}
      disableRipple
      aria-describedby={hintId}
      onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
        if (event.button !== 0) return
        event.currentTarget.setPointerCapture(event.pointerId)
        start()
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onBlur={release}
      onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
        if (!isHoldKey(event.key)) return
        event.preventDefault()
        if (!event.repeat) start()
      }}
      onKeyUp={(event: KeyboardEvent<HTMLButtonElement>) => {
        if (!isHoldKey(event.key)) return
        event.preventDefault()
        release()
        pressed.current = false
      }}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
        if (!pressed.current && event.detail === 0) confirm.current()
        pressed.current = false
      }}
      onContextMenu={(event) => event.preventDefault()}
      sx={[
        {
          position: "relative",
          overflow: "hidden",
          isolation: "isolate",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
          touchAction: "manipulation",
          animation: shake ? `${nudges[shake % 2]} .4s ease-in-out` : "none",
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box aria-hidden component="span" sx={{
        position: "absolute",
        inset: 0,
        zIndex: -1,
        bgcolor: fill,
        transformOrigin: "left center",
        transform: holding ? "scaleX(1)" : "scaleX(0)",
        transition: holding ? `transform ${HOLD_MS}ms linear` : "transform .25s ease-out",
        pointerEvents: "none",
      }} />
      {children}
      <Box aria-hidden component="span" sx={[{
        ml: 1.25,
        minWidth: hint === "full" && !holding ? "auto" : "2.4em",
        px: .9,
        py: .15,
        border: "1px solid currentColor",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        lineHeight: 1.6,
        letterSpacing: ".02em",
        textAlign: "center",
        whiteSpace: "nowrap",
        fontVariantNumeric: "tabular-nums",
        opacity: holding ? 1 : .75,
      }, ...(Array.isArray(counterSx) ? counterSx : [counterSx])]}>
        {holding ? `${left}s` : hint === "full" ? ct.template("Hold {v0}s", { v0: SECONDS }) : `${SECONDS}s`}
      </Box>
      <Box component="span" id={hintId} sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>
        {ct.template("Press and hold for {v0} seconds", { v0: SECONDS })}
      </Box>
    </Button>
  )
}
