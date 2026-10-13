import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Icon, { type IconName } from "../brand/Icon"
import { gutter } from "@/theme/tokens"

const ITEMS: { icon: IconName; title: string; text: string }[] = [
  { icon: "document", title: "Every lot has a record", text: "Documentation within reach" },
  { icon: "shield", title: "Details, made clear", text: "Transparent specifications" },
  { icon: "package", title: "Care in every shipment", text: "Protected, tracked delivery" },
  { icon: "support", title: "People behind the science", text: "Direct, responsive support" },
]
export default function TrustBar() {
  return <Box sx={{ px: gutter, pb: { xs: 6, md: 8 } }}>
    <Box component="ul" sx={{ listStyle: "none", p: 0, m: "0 auto", maxWidth: 1360, display: "grid", gridTemplateColumns: { xs: "repeat(2,1fr)", md: "repeat(4,1fr)" }, gap: { xs: 3, md: 4 }, pt: 4, borderTop: "1px solid rgba(23,53,75,.08)" }}>
      {ITEMS.map((item) => <Box component="li" key={item.title} sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
        <Icon name={item.icon} sx={{ fontSize: 28, color: "brand.blue", flexShrink: 0 }} />
        <Box><Typography sx={{ fontSize: { xs: 12, md: 13 }, fontWeight: 650, lineHeight: 1.5 }}>{item.title}</Typography><Typography sx={{ color: "text.secondary", fontSize: 11.5, mt: .25 }}>{item.text}</Typography></Box>
      </Box>)}
    </Box>
  </Box>
}
