import { alpha, type SxProps, type Theme } from "@mui/material/styles"
import { brand } from "@/theme/tokens"

/** The navy panel of the book's page and thank-you page: the cover on the left, the text beside it. */
export const bookPanelSx: SxProps<Theme> = {
  display: "grid",
  gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "190px minmax(0, 1fr)", md: "240px minmax(0, 1fr)" },
  alignItems: "center",
  gap: { xs: 2.5, sm: 5 },
  maxWidth: 880,
  p: { xs: "28px 20px", sm: "36px 44px" },
  borderRadius: { xs: "20px", md: "28px" },
  color: "brand.onNavy",
  bgcolor: "brand.navyDeep",
  backgroundImage: `radial-gradient(ellipse at 18% 50%, ${alpha(brand.blue, .42)}, transparent 65%)`,
  border: `1px solid ${alpha(brand.cyan, .22)}`,
}
