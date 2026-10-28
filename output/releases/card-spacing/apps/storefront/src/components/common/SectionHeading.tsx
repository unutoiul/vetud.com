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

/** A clear section title with supporting copy and an optional adjacent action. */
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
      spacing={{ xs: 3, md: 6 }}
      sx={{ justifyContent: "space-between", alignItems: { md: "flex-end" }, mb: { xs: 4, md: 6 } }}
    >
      <Box sx={{ maxWidth: 820 }}>
        <Typography variant="eyebrow" sx={{ color: light ? "brand.onNavyMuted" : "brand.blue", letterSpacing: ".06em" }}>
          {eyebrow}
        </Typography>
        <Typography
          variant="h2"
          component={as}
          sx={{ mt: 2, color: light ? "brand.onNavy" : "text.primary", textWrap: "balance", maxWidth: 780 }}
        >
          {title}
        </Typography>
        {description ? (
          <Typography sx={{ mt: 2, maxWidth: 640, color: light ? "brand.onNavyMuted" : "text.secondary", lineHeight: 1.8 }}>
            {description}
          </Typography>
        ) : null}
      </Box>
      {action ? (
        <Box sx={{ flexShrink: 0, pb: { md: 0.5 } }}>
          {action}
        </Box>
      ) : null}
    </Stack>
  )
}
