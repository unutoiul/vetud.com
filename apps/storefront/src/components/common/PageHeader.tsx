import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import type { ReactNode } from "react"
import { gutter } from "@/theme/tokens"
import Icon, { type IconName } from "../brand/Icon"

type PageHeaderProps = {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
}

function contextIcon(eyebrow: string): IconName {
  const label = eyebrow.toLowerCase()
  if (label.includes("collection") || label.includes("catalog")) return "flask"
  if (label.includes("documentation") || label.includes("legal")) return "document"
  if (label.includes("contact")) return "support"
  if (label.includes("standards")) return "shield"
  if (label.includes("cart")) return "bag"
  if (label.includes("checkout")) return "lock"
  return "molecule"
}

/** An airy, contained introduction that sets the rhythm for inner pages. */
export default function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  const icon = contextIcon(eyebrow)
  return (
    <Box
      sx={{
        bgcolor: "background.default",
        px: gutter,
        pt: { xs: 3, md: 5 },
        pb: { xs: 2, md: 3 },
      }}
    >
      <Box
        sx={{
          maxWidth: 1360,
          mx: "auto",
          bgcolor: "brand.mintWash",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: { xs: 3, md: 5 },
          p: { xs: 3.5, sm: 5, md: 7 },
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 5,
        }}
      >
        <Box sx={{ maxWidth: 930, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Icon name={icon} sx={{ color: "brand.blue", fontSize: 21 }} />
            <Typography variant="eyebrow" sx={{ color: "brand.navySoft", letterSpacing: ".06em" }}>
              {eyebrow}
            </Typography>
          </Box>
          <Typography
            variant="h1"
            component="h1"
            sx={{ mt: { xs: 2.5, md: 3 }, fontSize: { xs: 36, sm: 48, md: 64 }, lineHeight: 1.1, letterSpacing: "-.045em", textWrap: "balance" }}
          >
            {title}
          </Typography>
          {description ? (
            <Typography variant="lead" sx={{ color: "text.secondary", mt: 2.5, maxWidth: 660, fontSize: { xs: 16, md: 18 }, lineHeight: 1.8 }}>
              {description}
            </Typography>
          ) : null}
          {children ? <Box sx={{ mt: 3 }}>{children}</Box> : null}
        </Box>
        <Box
          aria-hidden="true"
          sx={{
            display: { xs: "none", lg: "flex" },
            flexShrink: 0,
            alignItems: "center",
            justifyContent: "center",
            width: 152,
            height: 152,
            border: "1px solid",
            borderColor: "#d9e6eb",
            borderRadius: 4,
            bgcolor: "rgba(255,255,255,.68)",
            color: "brand.blue",
          }}
        >
          <Icon name={icon} sx={{ fontSize: 68 }} />
        </Box>
      </Box>
    </Box>
  )
}
