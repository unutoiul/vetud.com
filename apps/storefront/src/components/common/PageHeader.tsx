import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import type { ReactNode } from "react"
import { gutter } from "@/theme/tokens"

type PageHeaderProps = {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
}

/** Light page intro band used by inner pages. */
export default function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        bgcolor: "brand.mintWash",
        borderBottom: "1px solid",
        borderColor: "divider",
        px: gutter,
        pt: { xs: 6, md: 9 },
        pb: { xs: 5, md: 7 },
        "&::after": {
          content: '""',
          position: "absolute",
          right: { xs: -160, md: -60 },
          top: -120,
          width: 520,
          height: 320,
          border: "1px solid #c5e1da",
          borderRadius: "50%",
          transform: "rotate(-18deg)",
          pointerEvents: "none",
        },
      }}
    >
      <Box sx={{ maxWidth: 1240, mx: "auto", position: "relative", zIndex: 1 }}>
        <Typography variant="eyebrow" sx={{ color: "secondary.main" }}>
          {eyebrow}
        </Typography>
        <Typography variant="h2" component="h1" sx={{ mt: 1.5, maxWidth: 820 }}>
          {title}
        </Typography>
        {description ? (
          <Typography variant="lead" sx={{ color: "text.secondary", mt: 2, maxWidth: 620 }}>
            {description}
          </Typography>
        ) : null}
        {children}
      </Box>
    </Box>
  )
}
