import Box from "@mui/material/Box"
import type { SxProps, Theme } from "@mui/material/styles"
import Image from "next/image"
import { brand } from "@/theme/tokens"
import { AppLink } from "../common/links"
import { BOOK } from "./book"

export default function BookCover({
  alt,
  sizes,
  priority,
  href,
  sx,
}: {
  alt: string
  sizes: string
  priority?: boolean
  href?: string
  sx?: SxProps<Theme>
}) {
  const cover = (
    <Image
      src={BOOK.cover}
      width={BOOK.width}
      height={BOOK.height}
      alt={alt}
      sizes={sizes}
      preload={priority}
      style={{ display: "block", width: "100%", height: "auto", borderRadius: "inherit" }}
    />
  )
  const frame: SxProps<Theme> = [
    { display: "block", width: "100%", mx: "auto", borderRadius: "6px", boxShadow: `0 10px 28px ${brand.blackA22}` },
    ...(Array.isArray(sx) ? sx : [sx ?? {}]),
  ]
  return href ? (
    <AppLink href={href} sx={frame}>
      {cover}
    </AppLink>
  ) : (
    <Box component="span" sx={frame}>
      {cover}
    </Box>
  )
}
