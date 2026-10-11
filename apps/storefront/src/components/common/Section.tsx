import Box, { type BoxProps } from "@mui/material/Box"
import { gutter } from "@/theme/tokens"

type SectionProps = BoxProps & {
  tone?: "paper" | "white" | "wash" | "navy"
  tight?: boolean
}

const backgrounds = {
  paper: "background.default",
  white: "background.paper",
  wash: "brand.mintWash",
  navy: "brand.navy",
} as const

/** Full-width band with the site's horizontal gutters and a centered max-width column. */
export default function Section({ tone = "paper", tight, children, sx, ...props }: SectionProps) {
  return (
    <Box
      component="section"
      sx={[
        {
          bgcolor: backgrounds[tone],
          color: tone === "navy" ? "brand.onNavy" : "text.primary",
          px: gutter,
          py: tight ? { xs: 5, md: 7 } : { xs: 8, md: 12 },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      <Box sx={{ maxWidth: 1240, mx: "auto" }}>{children}</Box>
    </Box>
  )
}
