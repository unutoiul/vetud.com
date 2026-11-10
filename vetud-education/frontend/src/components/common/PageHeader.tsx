import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import type { ReactNode } from "react"
import { gutter } from "@/theme/tokens"
import { getContentTranslator } from "@/i18n/server-content"

type PageHeaderProps = { eyebrow: string; title: ReactNode; description?: ReactNode; children?: ReactNode }

export default async function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  const ct = await getContentTranslator()
  return <Box component="header" sx={{ position: "relative", overflow: "hidden", bgcolor: "brand.paper", borderBottom: "1px solid", borderColor: "divider", px: gutter, pt: { xs: 5, md: 8 }, pb: { xs: 5, md: 7 } }}>
    <Box aria-hidden sx={{ position: "absolute", right: 0, bottom: 0, width: { xs: "65%", md: "40%" }, height: "100%", opacity: { xs: .14, md: .4 }, maskImage: "linear-gradient(to right, transparent, black)" }}><Image src="/images/vetud-alpine-landscape.webp" alt="" fill sizes="40vw" style={{ objectFit: "cover", objectPosition: "bottom right" }} /></Box>
    <Box sx={{ maxWidth: 1360, mx: "auto", position: "relative" }}>
      <Typography variant="mono" component="p" sx={{ color: "brand.blue", fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase" }}>{ct.rich("VETUD / {v0}", { v0: ct(eyebrow) }, {  })}</Typography>
      <Typography variant="h1" component="h1" sx={{ mt: 2.75, maxWidth: 920, fontSize: { xs: 39, sm: 52, md: 64 }, fontWeight: 400, lineHeight: 1.12, letterSpacing: "-.055em" }}>{ct(title)}</Typography>
      {description ? <Typography sx={{ color: "text.secondary", mt: 2.5, maxWidth: 640, fontSize: { xs: 15, md: 16 }, lineHeight: 1.85 }}>{ct(description)}</Typography> : null}
      {children ? <Box sx={{ mt: 3 }}>{children}</Box> : null}
    </Box>
  </Box>
}
