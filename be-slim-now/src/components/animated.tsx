"use client"

import { animate, AnimatePresence, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react"
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { gradients } from "@/theme/tokens"

/**
 * Motion for the hero, in two layers:
 *
 * - **Entrances** are CSS animations (`enter()` + the keyframes in `EnterKeyframes`). They're in the
 *   server HTML, so they play on first paint and the hero never sits blank waiting for JavaScript.
 *   `backwards` fill hands each element back to its own styles when it lands, so Motion's hover and
 *   parallax take over cleanly.
 * - **Everything live** (count-up, rotating words, light sweeps, floating pens, mouse parallax, hover)
 *   uses Motion once the page is running.
 *
 * With "reduce motion" switched on in the visitor's system, entrances become plain fades and Motion
 * drops transforms and loops (MotionConfig reducedMotion="user" in Hero).
 */

/** Fast start, long soft landing. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const
const EASE_OUT_CSS = `cubic-bezier(${EASE_OUT.join(", ")})`
/** Overshoots a touch and settles, like a light spring. */
export const SPRING_CSS = "cubic-bezier(0.34, 1.56, 0.64, 1)"

const KEYFRAMES = `
@keyframes vetud-rise { from { opacity: 0; transform: translateY(112%) rotate(4deg); } }
@keyframes vetud-up { from { opacity: 0; transform: translateY(var(--enter-y, 18px)); } }
@keyframes vetud-drop { from { opacity: 0; transform: translateY(-10px) scale(0.96); } }
@keyframes vetud-pop { from { opacity: 0; transform: translateY(18px) scale(0.92); } }
@keyframes vetud-spin { from { opacity: 0; transform: scale(0.2) rotate(-140deg); } }
@keyframes vetud-glide { from { opacity: 0; transform: translate(var(--enter-x, 0px), var(--enter-y, 0px)) rotate(var(--enter-r, 0deg)); } }
@keyframes vetud-bloom { from { opacity: 0; transform: scale(var(--enter-scale, 0.8)); } }
@keyframes vetud-settle { from { transform: scale(var(--enter-scale, 1.06)); } }
@keyframes vetud-grow { from { transform: scaleX(0); } }
@keyframes vetud-draw { from { stroke-dashoffset: 1; opacity: 0; } 20% { opacity: 1; } to { stroke-dashoffset: 0; opacity: 1; } }
@keyframes vetud-fade { from { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  [style*="vetud-"] { animation-name: vetud-fade !important; }
  [style*="vetud-settle"] { animation-name: none !important; }
}
`

/** The entrance keyframes, hoisted into <head> once by React. */
export function EnterKeyframes() {
  return (
    <style href="vetud-enter-keyframes" precedence="default">
      {KEYFRAMES}
    </style>
  )
}

type Entrance = "rise" | "up" | "drop" | "pop" | "spin" | "glide" | "bloom" | "settle" | "grow" | "draw"

/**
 * Inline style for a CSS entrance. `vars` tune the keyframes: --enter-x/--enter-y/--enter-r for
 * glide and up, --enter-scale for bloom and settle. "settle" only scales (no fade), so the big
 * background picture still counts as painted at once for Largest Contentful Paint.
 */
export function enter(
  name: Entrance,
  { delay = 0, duration = 0.9, easing = EASE_OUT_CSS, vars }: { delay?: number; duration?: number; easing?: string; vars?: Record<`--enter-${string}`, string> } = {},
): CSSProperties {
  return { animation: `vetud-${name} ${duration}s ${easing} ${delay}s backwards`, ...vars }
}

/** Hidden on screen, still read by screen readers (the animated copy next to it is aria-hidden). */
export const srOnly: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
}

/** Rises a few pixels while fading in. */
export function FadeUp({ children, delay = 0, y = 18, style }: { children: ReactNode; delay?: number; y?: number; style?: CSSProperties }) {
  return <div style={{ ...enter("up", { delay, duration: 0.8, vars: { "--enter-y": `${y}px` } }), ...style }}>{children}</div>
}

/**
 * One word rising out of an invisible slot, the way type comes up on a film title. `overflow: clip`
 * (not hidden) keeps the word on the line's baseline; the padding gives descenders room.
 */
export function RisingWord({ children, delay }: { children: ReactNode; delay: number }) {
  return (
    <span style={{ display: "inline-block", overflow: "clip", padding: "0.06em 0 0.16em", margin: "-0.06em 0 -0.16em", verticalAlign: "baseline" }}>
      <span style={{ display: "inline-block", transformOrigin: "0% 100%", ...enter("rise", { delay }) }}>{children}</span>
    </span>
  )
}

/**
 * Counts up from 0 to `to` in step with its word rising into view. The server HTML already says `to`,
 * so the number is right even before JavaScript runs; if the page wakes up after the word has
 * landed, it just stays put.
 */
export function CountUp({ to, delay = 0, duration = 1.2 }: { to: number; delay?: number; duration?: number }) {
  const value = useMotionValue(to)
  const text = useTransform(value, (latest) => String(Math.round(latest)))
  const reduce = useReducedMotion()

  useEffect(() => {
    const elapsed = performance.now() / 1000
    if (reduce || elapsed > delay + 0.4) return
    value.set(0)
    const controls = animate(value, to, { duration, delay: Math.max(0, delay - elapsed), ease: [0.16, 1, 0.3, 1] })
    return () => controls.stop()
  }, [to, delay, duration, reduce, value])

  return <motion.span style={{ display: "inline-block", fontVariantNumeric: "tabular-nums" }}>{text}</motion.span>
}

/** A band of light that crosses its (position: relative; overflow: hidden) parent every few seconds. */
export function Shine({ delay = 2, every = 4, width = "45%" }: { delay?: number; every?: number; width?: string }) {
  return (
    <motion.span
      aria-hidden
      style={{ position: "absolute", top: 0, bottom: 0, left: 0, width, background: gradients.shine, pointerEvents: "none" }}
      initial={{ x: "-110%" }}
      animate={{ x: "330%" }}
      transition={{ duration: 1.1, ease: "easeInOut", repeat: Infinity, repeatDelay: every, delay }}
    />
  )
}

/**
 * Cycles through short phrases: the current one slides up and out, the next slides up into its
 * place. Pauses while off screen or under the mouse, and stays on the first phrase for visitors who
 * reduce motion. The parent should give screen readers the full list once.
 */
export function Rotator({ items, interval = 2600, style }: { items: readonly string[]; interval?: number; style?: CSSProperties }) {
  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!inView || hovered || reduce) return
    const id = window.setInterval(() => setIndex((current) => (current + 1) % items.length), interval)
    return () => window.clearInterval(id)
  }, [inView, hovered, reduce, interval, items.length])

  return (
    <span
      ref={ref}
      aria-hidden
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      style={{ position: "relative", display: "inline-block", overflow: "clip", verticalAlign: "baseline", padding: "0 0 0.12em", margin: "0 0 -0.12em" }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={items[index]}
          style={{ display: "inline-block", whiteSpace: "nowrap", ...style }}
          initial={{ y: "100%", opacity: 0, filter: "blur(6px)" }}
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-100%", opacity: 0, filter: "blur(6px)" }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
        >
          {items[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
