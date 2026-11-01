"use client"

import Button, { type ButtonProps } from "@mui/material/Button"
import MuiLink, { type LinkProps as MuiLinkProps } from "@mui/material/Link"
import NextLink from "next/link"
import { forwardRef } from "react"
import { useCountryCode } from "../store/StoreProvider"

/** Prefixes internal paths with the visitor's country, e.g. "/shop" -> "/us/shop". */
export function useLocalizedHref() {
  // The country comes from the store context (set by the root layout), not from URL hooks,
  // so links never block prerendering of routes with unknown params.
  const countryCode = useCountryCode()
  return (href: string) => {
    if (!href.startsWith("/") || !countryCode) {
      return href
    }
    return href === "/" ? `/${countryCode}` : `/${countryCode}${href}`
  }
}

type LocalizedNextLinkProps = React.ComponentProps<typeof NextLink> & { href: string }

/** next/link with the country prefix applied. Use it as `component` for MUI components. */
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
