import Link from "@mui/material/Link"
import type { ReactNode } from "react"
import { AppLink } from "@/components/common/links"
import { useContentTranslator } from "@/i18n/use-content-translator"

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g

/**
 * Article prose with inline links written as [label](target). Targets are site paths
 * ("/learn/bpc-157") or external URLs.
 */
export default function RichText({ text: source }: { text: string }) {
  const ct = useContentTranslator()
  const text = ct(source)
  const parts: ReactNode[] = []
  let last = 0
  for (const match of text.matchAll(LINK)) {
    const [whole, label, target] = match
    parts.push(text.slice(last, match.index))
    if (target.startsWith("http")) {
      parts.push(<Link key={match.index} href={target} target="_blank" rel="noopener noreferrer">{label}</Link>)
    } else {
      parts.push(<AppLink key={match.index} href={target}>{label}</AppLink>)
    }
    last = match.index + whole.length
  }
  parts.push(text.slice(last))
  return <>{parts}</>
}
