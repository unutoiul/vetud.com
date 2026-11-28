"use client"

import { ServerInsertedHTMLContext } from "next/navigation"
import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  useCallback,
  useContext,
  type ContextType,
  type ReactElement,
  type ReactNode,
} from "react"

type InsertedHTML = Parameters<NonNullable<ContextType<typeof ServerInsertedHTMLContext>>>[0]
type StyleProps = { "data-emotion"?: string; dangerouslySetInnerHTML?: { __html?: string } }

// The style tags already written into one page's HTML, keyed by that page render's insertion hook.
const written = new WeakMap<object, Set<string>>()

/** Keeps each <style> tag the first time, and drops it when the identical tag was already written for this page. */
function withoutRepeats(node: ReactNode, seen: Set<string>): ReactNode {
  return Children.map(node, (child) => {
    if (!isValidElement(child)) return child
    if (child.type === Fragment) {
      return (
        <Fragment key={child.key}>{withoutRepeats((child.props as { children?: ReactNode }).children, seen)}</Fragment>
      )
    }
    if (child.type !== "style") return child
    const props = child.props as StyleProps
    const id = `${props["data-emotion"] ?? ""}\n${props.dangerouslySetInnerHTML?.__html ?? ""}`
    if (seen.has(id)) return null
    seen.add(id)
    return cloneElement(child as ReactElement<StyleProps>, { key: child.key ?? props["data-emotion"] })
  })
}

/**
 * Next 16 prerenders each page's HTML twice (a first pass to warm the caches, then the real one) and
 * keeps the style callbacks from both, so MUI's Emotion styles were written into the <head> twice:
 * about 200 KB of identical CSS on every page. Two identical copies also make Chrome restyle and
 * re-lay out the whole page whenever a new style is added later (opening the welcome splash, a menu,
 * the cart), which Lighthouse reports as a forced reflow. This passes each style tag through once.
 */
export default function SingleServerStyles({ children }: { children: ReactNode }) {
  const insert = useContext(ServerInsertedHTMLContext)
  const insertOnce = useCallback(
    (callback: InsertedHTML) => {
      if (!insert) return
      let seen = written.get(insert)
      if (!seen) written.set(insert, (seen = new Set()))
      const page = seen
      insert(() => withoutRepeats(callback(), page))
    },
    [insert],
  )
  // In the browser there is no insertion hook (null), so nothing changes there.
  return (
    <ServerInsertedHTMLContext.Provider value={insert ? insertOnce : null}>
      {children}
    </ServerInsertedHTMLContext.Provider>
  )
}
