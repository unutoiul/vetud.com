import Box from "@mui/material/Box"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import type { ReactNode } from "react"

type SectionHeadingProps = {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  tone?: "dark" | "light"
  as?: "h1" | "h2"
}

/** Mono eyebrow + large heading + optional side copy, as used across the concept. */
export default function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  tone = "dark",
  as = "h2",
}: SectionHeadingProps) {
  const light = tone === "light"
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={{ xs: 2, md: 6 }}
      sx={{ justifyContent: "space-between", alignItems: { md: "flex-end" }, mb: { xs: 4, md: 5 } }}
    >
      <Box sx={{ maxWidth: 720 }}>
        <Typography variant="eyebrow" sx={{ color: light ? "brand.tealBright" : "secondary.main" }}>
          {eyebrow}
        </Typography>
        <Typography
          variant="h2"
          component={as}
          sx={{ mt: 1.5, color: light ? "brand.onNavy" : "text.primary" }}
        >
          {title}
        </Typography>
      </Box>
      {description || action ? (
        <Stack spacing={2} sx={{ maxWidth: 360, alignItems: "flex-start" }}>
          {description ? (
            <Typography sx={{ color: light ? "brand.onNavyMuted" : "text.secondary" }}>
              {description}
            </Typography>
          ) : null}
          {action}
        </Stack>
      ) : null}
    </Stack>
  )
}

/** Italic serif accent word inside headings, e.g. "Precision begins at the *sequence.*" */
export function SerifAccent({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <Typography
      variant="serifAccent"
      component="span"
      sx={{ fontSize: "1.08em", color: color ?? "secondary.main", lineHeight: "inherit" }}
    >
      {children}
    </Typography>
  )
}
