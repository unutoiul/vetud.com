import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import Icon, { type IconName } from "@/components/brand/Icon"
import { AppLink } from "@/components/common/links"
import { PEN_EXPLAINER_IMAGE } from "@/lib/product-images"

export const EXPLAINER_VIDEO = { src: "/videos/dual-chamber-explainer.mp4", poster: "/videos/dual-chamber-explainer.webp", duration: "PT40S" }

const POINTS: { icon: IconName; title: string; text: string }[] = [
  { icon: "molecule", title: "Two chambers, one cartridge", text: "The freeze-dried peptide and the bacteriostatic (BAC) water sit in separate chambers, divided by a rubber stopper. They stay apart until the cartridge is used." },
  { icon: "package", title: "Everything in one box", text: "The pen kit has the pen body, the cartridge, 12 disposable needles and an instruction booklet. There's no separate water to buy." },
  { icon: "coin", title: "The vial costs less", text: "Choose the vial if you already have bacteriostatic water and your own lab supplies. It's the lowest price for the same amount." },
]

export type FormatPrices = { pen?: string; vial?: string }

/** Pen vs vial, side by side. Prices are "from" prices for the product, when there is one. */
export function FormatComparison({ prices }: { prices?: FormatPrices }) {
  const rows = [
    { label: "What you get", pen: "Pen body, dual-chamber cartridge, 12 needles, booklet", vial: "1 sealed vial of freeze-dried powder" },
    { label: "BAC water", pen: "Included, in the cartridge", vial: "Sold separately" },
    { label: "Price", pen: prices?.pen ? `From ${prices.pen}` : "Higher", vial: prices?.vial ? `From ${prices.vial}` : "Lower" },
  ]
  return (
    <Box component="table" aria-label="Dual-chamber pen compared with vial" sx={{ width: "100%", borderCollapse: "collapse", fontSize: 14, "& th, & td": { textAlign: "left", verticalAlign: "top", py: 1.5, px: { xs: 1, sm: 1.5 }, borderBottom: "1px solid", borderColor: "divider", lineHeight: 1.55 }, "& thead th": { fontSize: 13, fontWeight: 700, color: "brand.ink", borderBottomWidth: 2 }, "& tbody th": { fontWeight: 600, color: "text.secondary", width: { xs: "28%", sm: "24%" } } }}>
      <thead>
        <tr><td /><th scope="col">Dual-chamber pen</th><th scope="col">Vial</th></tr>
      </thead>
      <tbody>
        {rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td>{row.pen}</td><td>{row.vial}</td></tr>)}
      </tbody>
    </Box>
  )
}

/** The explainer video, loaded only when played. It has on-screen text and no voiceover. */
export function ExplainerVideo({ title = "How the VETUD dual-chamber pen works" }: { title?: string }) {
  return (
    <Box component="figure" sx={{ m: 0 }}>
      <Box component="video" controls preload="none" playsInline poster={EXPLAINER_VIDEO.poster} aria-label={title}
        sx={{ display: "block", width: "100%", aspectRatio: "16 / 9", bgcolor: "#eef4fb", borderRadius: "8px", border: "1px solid", borderColor: "divider" }}>
        <source src={EXPLAINER_VIDEO.src} type="video/mp4" />
      </Box>
      <Typography component="figcaption" sx={{ mt: 1, fontSize: 12.5, color: "text.secondary" }}>{title} · 40 seconds, no sound needed</Typography>
    </Box>
  )
}

const GUIDE_LINK = (
  <AppLink href="/dual-chamber-pen" sx={{ mt: 1.5, display: "inline-flex", alignItems: "center", gap: 0.75, minHeight: 44, fontSize: 15, fontWeight: 600 }}>
    Watch the full guide: how the dual-chamber pen works <Icon name="arrowRight" sx={{ fontSize: 18 }} />
  </AppLink>
)

/**
 * The "Dual-chamber pen or vial?" section on every product sold in both formats. Supplies such as
 * bacteriostatic water get the short version: the video and the guide link.
 */
export default function DualChamberExplainer({ prices, supply }: { prices?: FormatPrices; supply?: boolean }) {
  if (supply) {
    return (
      <Box component="section" aria-labelledby="formats-title" sx={{ mt: { xs: 6, md: 9 }, pt: { xs: 5, md: 7 }, borderTop: "1px solid", borderColor: "divider", display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 5fr) minmax(0, 7fr)" }, gap: { xs: 3, md: 7 }, alignItems: "center" }}>
        <Box>
          <Typography variant="eyebrow" component="p" sx={{ color: "brand.blue" }}>Formats</Typography>
          <Typography id="formats-title" component="h2" sx={{ mt: 1, fontSize: { xs: 28, md: 36 }, fontWeight: 500, letterSpacing: "-.035em" }}>Cartridge or vial?</Typography>
          <Typography sx={{ mt: 1.5, fontSize: 16, lineHeight: 1.75, color: "text.secondary" }}>
            The cartridge fits the VETUD dual-chamber pen. The vial is the lower-cost, multi-use option for your own lab supplies. The video shows how the pen holds a cartridge.
          </Typography>
          {GUIDE_LINK}
        </Box>
        <ExplainerVideo />
      </Box>
    )
  }
  return (
    <Box component="section" aria-labelledby="formats-title" sx={{ mt: { xs: 6, md: 9 }, pt: { xs: 5, md: 7 }, borderTop: "1px solid", borderColor: "divider" }}>
      <Typography variant="eyebrow" component="p" sx={{ color: "brand.blue" }}>Formats</Typography>
      <Typography id="formats-title" component="h2" sx={{ mt: 1, fontSize: { xs: 28, md: 36 }, fontWeight: 500, letterSpacing: "-.035em" }}>Dual-chamber pen or vial?</Typography>
      <Typography sx={{ mt: 1.5, maxWidth: 680, fontSize: 16, lineHeight: 1.75, color: "text.secondary" }}>
        Every product comes in both. It&apos;s the same peptide and the same amounts; what changes is the packaging, what&apos;s included and the price.
      </Typography>

      <Box sx={{ mt: { xs: 3.5, md: 5 }, display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 5fr) minmax(0, 7fr)" }, gap: { xs: 4, md: 7 }, alignItems: "start" }}>
        <Box sx={{ position: "relative", aspectRatio: "1 / 1", borderRadius: "8px", overflow: "hidden", border: "1px solid", borderColor: "divider", bgcolor: "#eef4fb" }}>
          <Image src={PEN_EXPLAINER_IMAGE} alt="The VETUD dual-chamber pen: the cartridge, with peptide powder and BAC water, goes into the cartridge holder above the pen body" fill sizes="(max-width: 900px) 100vw, 40vw" style={{ objectFit: "contain" }} />
        </Box>
        <Box>
          <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 2.5 }}>
            {POINTS.map((point, index) => (
              <Box component="li" key={point.title} sx={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: 2 }}>
                <Box aria-hidden sx={{ width: 44, height: 44, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "brand.mintWash", color: "brand.blue" }}><Icon name={point.icon} sx={{ fontSize: 22 }} /></Box>
                <Box>
                  <Typography component="h3" sx={{ fontSize: 17, fontWeight: 650, color: "brand.ink" }}><Box component="span" sx={{ color: "brand.blue", mr: 1, fontVariantNumeric: "tabular-nums" }}>{index + 1}.</Box>{point.title}</Typography>
                  <Typography sx={{ mt: 0.5, fontSize: 15, lineHeight: 1.7, color: "text.secondary" }}>{point.text}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
          <Box sx={{ mt: 4 }}><FormatComparison prices={prices} /></Box>
          <Box sx={{ mt: 4 }}><ExplainerVideo /></Box>
          {GUIDE_LINK}
        </Box>
      </Box>
    </Box>
  )
}
