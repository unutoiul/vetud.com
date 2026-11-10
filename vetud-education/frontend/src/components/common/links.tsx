"use client"

import Button, { type ButtonProps } from "@mui/material/Button"
import MuiLink, { type LinkProps as MuiLinkProps } from "@mui/material/Link"
import NextLink from "next/link"
import { forwardRef } from "react"
import { useLanguage } from "./language"

/** Prefixes internal paths with the visitor's language, e.g. "/learn" -> "/en/learn". */
export function useLocalizedHref() {
  const language = useLanguage()
  return (href: string) => {
    if (!href.startsWith("/")) return href
    return href === "/" ? `/${language}` : `/${language}${href}`
  }
}

type LocalizedNextLinkProps = React.ComponentProps<typeof NextLink> & { href: string }

/** next/link with the language prefix applied. Use it as `component` for MUI components. */
export const LocalizedNextLink = forwardRef<HTMLAnchorElement, LocalizedNextLinkProps>(
  function LocalizedNextLink({ href, ...props }, ref) {
    const localize = useLocalizedHref()
    return <NextLink ref={ref} href={localize(href)} {...props} />
  }
)

export function ButtonLink({ href, ...props }: ButtonProps & { href: string }) {
  return <Button component={LocalizedNextLink} href={href} {...props} />
}

export function AppLink({ href, ...props }: MuiLinkProps & { href: string }) {
  return <MuiLink component={LocalizedNextLink} href={href} {...props} />
}
