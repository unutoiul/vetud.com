import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import Icon, { type IconName } from "@/components/brand/Icon"
import { AppLink } from "@/components/common/links"
import type { FormatPhotos } from "@/lib/product-images"

export const EXPLAINER_VIDEO = { src: "/videos/dual-chamber-explainer.mp4", poster: "/videos/dual-chamber-explainer.webp", duration: "PT40S" }

const POINTS: { icon: IconName; title: string; text: string }[] = [
  { icon: "molecule", title: "Two chambers, one cartridge", text: "The freeze-dried peptide and the bacteriostatic (BAC) water sit in separate chambers, divided by a rubber stopper. They stay apart until the cartridge is used." },
  { icon: "package", title: "Everything in one box", text: "The pen kit has the pen body, the cartridge, 12 disposable needles and an instruction booklet. There's no separate water to buy." },
  { icon: "coin", title: "The vial costs less", text: "Choose the vial if you already have bacteriostatic water and your own lab supplies. It's the lowest price for the same amount." },
]

export type FormatPrices = { pen?: string; vial?: string }

const FACTS = {
  pen: { contents: "Pen body, dual-chamber cartridge, 12 needles, booklet", water: "Included, in the cartridge" },
  vial: { contents: "1 sealed vial of freeze-dried powder", water: "Sold separately" },
}

/** Pen vs vial, side by side. Prices are "from" prices for the product, when there is one. */
export function FormatComparison({ prices }: { prices?: FormatPrices }) {
  const rows = [
    { label: "What you get", pen: FACTS.pen.contents, vial: FACTS.vial.contents },
    { label: "BAC water", pen: FACTS.pen.water, vial: FACTS.vial.water },
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

type Photo = { url: string; alt: string }

/**
 * One format with its photos, price and what comes with it. The cartridge photo is square with a
 * slim cartridge in the middle, so it's cropped to a narrow column (`slim`) beside the box.
 */
function FormatCard({ id, title, price, photos, facts }: { id: string; title: string; price?: string; photos: (Photo & { slim?: boolean })[]; facts: { contents: string; water: string } }) {
  return (
    <Box component="article" aria-labelledby={id} sx={{ display: "flex", flexDirection: "column", border: "1px solid", borderColor: "divider", borderRadius: "8px", overflow: "hidden", bgcolor: "#fff" }}>
      <Box sx={{ aspectRatio: "4 / 3", display: "flex", justifyContent: "center", gap: "3%", p: "5%", borderBottom: "1px solid", borderColor: "divider" }}>
        {photos.map((photo) => (
          <Box key={photo.url} sx={{ position: "relative", flex: photo.slim ? "0 0 26%" : "1 1 0", overflow: "hidden" }}>
            <Image src={photo.url} alt={photo.alt} fill sizes={photo.slim ? "(max-width: 600px) 25vw, 12vw" : "(max-width: 600px) 80vw, 30vw"} style={{ objectFit: photo.slim ? "cover" : "contain" }} />
          </Box>
        ))}
      </Box>
      <Box sx={{ p: { xs: 2.5, md: 3 }, flex: 1 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", columnGap: 2, rowGap: 0.5 }}>
          <Typography id={id} component="h3" sx={{ fontSize: 19, fontWeight: 650, color: "brand.ink" }}>{title}</Typography>
          {price ? <Typography sx={{ fontSize: 15, fontWeight: 650, color: "brand.blue", fontVariantNumeric: "tabular-nums" }}>From {price}</Typography> : null}
        </Box>
        <Box component="dl" sx={{ m: 0, mt: 2, display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 2, rowGap: 1.25, fontSize: 14, lineHeight: 1.6, "& dt": { fontWeight: 600, color: "text.secondary" }, "& dd": { m: 0, color: "brand.ink" } }}>
          <dt>What you get</dt><dd>{facts.contents}</dd>
          <dt>BAC water</dt><dd>{facts.water}</dd>
        </Box>
      </Box>
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

const HEADING = { component: "h2", variant: "h3", id: "formats-heading", sx: { mb: 2.5 } } as const

/**
 * The "Dual-chamber pen or vial?" part of the product dossier, on every product sold in both
 * formats (the dossier supplies the section and its menu entry). Supplies such as bacteriostatic
 * water get the short version: the video and the guide link.
 */
export default function DualChamberExplainer({ prices, photos, supply }: { prices?: FormatPrices; photos?: FormatPhotos; supply?: boolean }) {
  if (supply) {
    return (
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 5fr) minmax(0, 7fr)" }, gap: { xs: 3, md: 5 }, alignItems: "center" }}>
        <Box>
          <Typography {...HEADING}>Cartridge or vial?</Typography>
          <Typography sx={{ fontSize: 15, lineHeight: 1.8, color: "text.secondary" }}>
            The cartridge fits the VETUD dual-chamber pen. The vial is the lower-cost, multi-use option for your own lab supplies. The video shows how the pen holds a cartridge.
          </Typography>
          {GUIDE_LINK}
        </Box>
        <ExplainerVideo />
      </Box>
    )
  }
  return (
    <Box>
      <Typography {...HEADING}>Dual-chamber pen or vial?</Typography>
      <Typography sx={{ maxWidth: 680, fontSize: 15, lineHeight: 1.8, color: "text.secondary" }}>
        Every product comes in both. It&apos;s the same peptide and the same amounts; what changes is the packaging, what&apos;s included and the price.
      </Typography>

      {photos ? (
        <Box sx={{ mt: { xs: 3, md: 4 }, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: { xs: 2, md: 3 } }}>
          <FormatCard id="format-pen-title" title="Dual-chamber pen" price={prices?.pen} facts={FACTS.pen} photos={[{ ...photos.pen, slim: true }, ...(photos.box ? [photos.box] : [])]} />
          <FormatCard id="format-vial-title" title="Vial" price={prices?.vial} facts={FACTS.vial} photos={[photos.vial]} />
        </Box>
      ) : (
        <Box sx={{ mt: { xs: 3, md: 4 } }}><FormatComparison prices={prices} /></Box>
      )}

      <Box sx={{ mt: { xs: 4, md: 5 }, display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 5fr) minmax(0, 7fr)" }, gap: { xs: 4, md: 5 }, alignItems: "center" }}>
        <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 3 }}>
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
        <Box>
          <ExplainerVideo />
          {GUIDE_LINK}
        </Box>
      </Box>
    </Box>
  )
}
