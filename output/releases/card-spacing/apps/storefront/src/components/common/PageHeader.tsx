import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import type { ReactNode } from "react"
import { getTranslations } from "next-intl/server"
import { gutter } from "@/theme/tokens"

type PageHeaderProps = { eyebrow: string; title: ReactNode; description?: ReactNode; children?: ReactNode }

const titleKeys = {
  "A precise place to begin.": "shopTitle", "People behind the science.": "contactTitle", "Precision is a practice.": "standardsTitle", "Every lot, on the record.": "documentationTitle", "Peptide science, made clear.": "educationTitle", "A simpler way to order.": "accountTitle", "Follow your parcel.": "trackingTitle", "Review your selection.": "cartTitle",
} as const

export default async function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  const t = await getTranslations("Pages")
  const checkout = await getTranslations("Checkout")
  const common = await getTranslations("Common")
  const titleKey = typeof title === "string" ? titleKeys[title as keyof typeof titleKeys] : undefined
  const heading = title === "Complete your order." ? checkout("title") : titleKey ? t(titleKey) : title
  const descriptionKeys = { accountTitle: "accountDescription", documentationTitle: "documentationDescription", educationTitle: "educationDescription", standardsTitle: "standardsDescription", trackingTitle: "trackingDescription", cartTitle: "cartDescription" } as const
  const descriptionKey = titleKey ? descriptionKeys[titleKey as keyof typeof descriptionKeys] : undefined
  const detail = descriptionKey ? t(descriptionKey) : titleKey === "shopTitle" ? t("shopDescription") : titleKey === "contactTitle" ? t("contactDescription") : title === "Complete your order." ? checkout("description") : description
  const label = ({ "Contact": common("contact"), "Our standards": common("standards"), "Documentation": common("documentation"), "Education": common("learn"), "Tracking": common("tracking"), "Your cart": common("cart"), "Account": common("account"), "Secure checkout": checkout("title") } as Record<string, string>)[eyebrow] ?? eyebrow
  return <Box component="header" sx={{ position: "relative", overflow: "hidden", bgcolor: "brand.paper", borderBottom: "1px solid", borderColor: "divider", px: gutter, pt: { xs: 5, md: 8 }, pb: { xs: 5, md: 7 } }}>
    <Box aria-hidden sx={{ position: "absolute", right: 0, bottom: 0, width: { xs: "65%", md: "40%" }, height: "100%", opacity: { xs: .14, md: .4 }, maskImage: "linear-gradient(to right, transparent, black)" }}><Image src="/images/vetud-alpine-landscape.webp" alt="" fill sizes="40vw" style={{ objectFit: "cover", objectPosition: "bottom right" }} /></Box>
    <Box sx={{ maxWidth: 1360, mx: "auto", position: "relative" }}>
      <Typography variant="mono" component="p" sx={{ color: "brand.blue", fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase" }}>VETUD / {label}</Typography>
      <Typography variant="h1" component="h1" sx={{ mt: 2.75, maxWidth: 920, fontSize: { xs: 39, sm: 52, md: 64 }, fontWeight: 400, lineHeight: 1.12, letterSpacing: "-.055em" }}>{heading}</Typography>
      {description ? <Typography sx={{ color: "text.secondary", mt: 2.5, maxWidth: 640, fontSize: { xs: 15, md: 16 }, lineHeight: 1.85 }}>{detail}</Typography> : null}
      {children ? <Box sx={{ mt: 3 }}>{children}</Box> : null}
    </Box>
  </Box>
}
