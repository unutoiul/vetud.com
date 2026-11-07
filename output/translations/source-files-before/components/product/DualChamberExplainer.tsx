import { useTranslations } from "next-intl"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import Icon, { type IconName } from "@/components/brand/Icon"
import { AppLink } from "@/components/common/links"
import type { FormatPhotos } from "@/lib/product-images"

export const EXPLAINER_VIDEO = { src: "/videos/reusable-dual-chamber-pen.mp4", poster: "/videos/reusable-dual-chamber-pen.webp", duration: "PT51S", length: "51 seconds" }

const POINTS: { icon: IconName; title: string; text: string }[] = [
  { icon: "molecule", title: "Two chambers, one cartridge", text: "The freeze-dried peptide and the bacteriostatic (BAC) water sit in separate chambers, divided by a rubber stopper. They stay apart until the cartridge is used." },
  { icon: "package", title: "A reusable pen", text: "The pen kit box has the reusable pen body with a dual-chamber vial, 12 disposable needles and a booklet. The drive, dial and indicator window stay with the pen: when a cartridge is empty, fit a new dual-chamber vial." },
  { icon: "coin", title: "The vial costs less", text: "Choose the vial if you already have bacteriostatic water and your own lab supplies. It's the lowest price for the same amount." },
]

export type FormatPrices = { pen?: string; box?: string; vial?: string }

const FACTS = {
  pen: { contents: "1 dual-chamber vial (cartridge), to refill the reusable pen", water: "Included, in the cartridge" },
  vial: { contents: "1 sealed vial of freeze-dried powder", water: "Sold separately" },
  box: { contents: "The reusable pen, 1 dual-chamber vial, 12 needles and a booklet, in the VETUD box", water: "Included, in the cartridge" },
}

/** Selank and Semax have a nasal spray in the pen kit box's place. */
const SPRAY = {
  title: "Nasal spray",
  facts: { contents: "A 10 ml nasal spray bottle in the VETUD box", water: "Not needed: the spray is a liquid" },
  intro: "Every product comes three ways. It's the same peptide and the same amounts; what changes is the packaging, what's included and the price. Choose the nasal spray in its VETUD box, a dual-chamber vial for the reusable pen, or a vial.",
  pen: "The dual-chamber vial fits the reusable VETUD pen, which comes in the pen kit box of the other VETUD peptides. The drive, dial and indicator window stay with the pen: when a cartridge is empty, fit a new dual-chamber vial.",
}

const COLUMNS = [
  { key: "box", title: "Pen kit box", fallback: "Highest" },
  { key: "pen", title: "Dual-chamber vial", fallback: "Mid-price" },
  { key: "vial", title: "Vial", fallback: "Lowest" },
] as const

/** The three formats side by side. Prices are "from" prices for the product, when there is one. */
export function FormatComparison({ prices }: { prices?: FormatPrices }) {
  const rows = [
    { label: "What you get", cells: COLUMNS.map((column) => FACTS[column.key].contents) },
    { label: "BAC water", cells: COLUMNS.map((column) => FACTS[column.key].water) },
    { label: "Price", cells: COLUMNS.map((column) => prices?.[column.key] ? `From ${prices[column.key]}` : column.fallback) },
  ]
  return (
    <Box component="table" aria-label="Pen kit box, dual-chamber vial and vial compared" sx={{ width: "100%", borderCollapse: "collapse", fontSize: 14, "& th, & td": { textAlign: "left", verticalAlign: "top", py: 1.5, px: { xs: 1, sm: 1.5 }, borderBottom: "1px solid", borderColor: "divider", lineHeight: 1.55 }, "& thead th": { fontSize: 13, fontWeight: 700, color: "brand.ink", borderBottomWidth: 2 }, "& tbody th": { fontWeight: 600, color: "text.secondary", width: { xs: "28%", sm: "24%" } } }}>
      <thead>
        <tr><td />{COLUMNS.map((column) => <th key={column.key} scope="col">{column.title}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th>{row.cells.map((cell, index) => <td key={COLUMNS[index].key}>{cell}</td>)}</tr>)}
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
      <Box sx={{ p: 2.5, flex: 1 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", columnGap: 2, rowGap: 0.5 }}>
          <Typography id={id} component="h3" sx={{ fontSize: 17, fontWeight: 650, color: "brand.ink" }}>{title}</Typography>
          {price ? <Typography sx={{ fontSize: 15, fontWeight: 650, color: "brand.blue", fontVariantNumeric: "tabular-nums" }}>From {price}</Typography> : null}
        </Box>
        <Box component="dl" sx={{ m: 0, mt: 1.5, display: "grid", rowGap: 0.25, fontSize: 13.5, lineHeight: 1.55, "& dt": { fontWeight: 600, color: "text.secondary", fontSize: 12, mt: 1 }, "& dd": { m: 0, color: "brand.ink" } }}>
          <dt>What you get</dt><dd>{facts.contents}</dd>
          <dt>BAC water</dt><dd>{facts.water}</dd>
        </Box>
      </Box>
    </Box>
  )
}

/** The reusable-pen video, loaded only when played. It explains itself with on-screen text. */
export function ExplainerVideo({ title = "The reusable VETUD dual-chamber pen" }: { title?: string }) {
  return (
    <Box component="figure" sx={{ m: 0 }}>
      <Box component="video" controls preload="none" playsInline poster={EXPLAINER_VIDEO.poster} aria-label={title}
        sx={{ display: "block", width: "100%", aspectRatio: "16 / 9", bgcolor: "#eef4fb", borderRadius: "8px", border: "1px solid", borderColor: "divider" }}>
        <source src={EXPLAINER_VIDEO.src} type="video/mp4" />
      </Box>
      <Typography component="figcaption" sx={{ mt: 1, fontSize: 12.5, color: "text.secondary" }}>{title} · {EXPLAINER_VIDEO.length}</Typography>
    </Box>
  )
}

function GuideLink() {
  const act = useTranslations("Actions")
  return (
    <AppLink href="/dual-chamber-pen" sx={{ mt: 1.5, display: "inline-flex", alignItems: "center", gap: 0.75, minHeight: 44, fontSize: 15, fontWeight: 600 }}>
      {act("penGuide")} <Icon name="arrowRight" sx={{ fontSize: 18 }} />
    </AppLink>
  )
}

const HEADING = { component: "h2", variant: "h3", id: "formats-heading", sx: { mb: 2.5 } } as const

/**
 * The "Dual-chamber pen or vial?" part of the product dossier, on every product sold in both
 * formats (the dossier supplies the section and its menu entry). Supplies such as bacteriostatic
 * water get the short version: the video and the guide link. `spray` shows the nasal spray in the
 * pen kit box's place (Selank, Semax).
 */
export default function DualChamberExplainer({ prices, photos, supply, spray }: { prices?: FormatPrices; photos?: FormatPhotos; supply?: boolean; spray?: boolean }) {
  const act = useTranslations("Actions")
  if (supply) {
    return (
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 5fr) minmax(0, 7fr)" }, gap: { xs: 3, md: 5 }, alignItems: "center" }}>
        <Box>
          <Typography {...HEADING}>Cartridge or vial?</Typography>
          <Typography sx={{ fontSize: 15, lineHeight: 1.8, color: "text.secondary" }}>
            The cartridge fits the reusable VETUD dual-chamber pen. The vial is the lower-cost, multi-use option for your own lab supplies. The video shows how the pen holds a cartridge.
          </Typography>
          {<GuideLink />}
        </Box>
        <ExplainerVideo />
      </Box>
    )
  }
  const points = spray ? POINTS.map((point, index) => (index === 1 ? { ...point, text: SPRAY.pen } : point)) : POINTS
  return (
    <Box>
      <Typography {...HEADING}>{spray ? act("nasalSpray") : act("penKit")}, dual-chamber vial or vial?</Typography>
      <Typography sx={{ maxWidth: 680, fontSize: 15, lineHeight: 1.8, color: "text.secondary" }}>
        {spray ? SPRAY.intro : "Every product comes three ways. It's the same peptide and the same amounts; what changes is the packaging, what's included and the price. Start with the pen kit box, which has the reusable pen, then refill it with dual-chamber vials."}
      </Typography>

      {photos ? (
        <Box sx={{ mt: { xs: 3, md: 4 }, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, gap: { xs: 2, md: 2.5 } }}>
          <FormatCard id="format-box-title" title={spray ? SPRAY.title : act("penKit")} price={prices?.box} facts={spray ? SPRAY.facts : FACTS.box} photos={[photos.kit]} />
          <FormatCard id="format-pen-title" title={act("dualChamber")} price={prices?.pen} facts={FACTS.pen} photos={[{ ...photos.pen, slim: true }]} />
          <FormatCard id="format-vial-title" title={act("vial")} price={prices?.vial} facts={FACTS.vial} photos={[photos.vial]} />
        </Box>
      ) : (
        <Box sx={{ mt: { xs: 3, md: 4 } }}><FormatComparison prices={prices} /></Box>
      )}

      <Box sx={{ mt: { xs: 4, md: 5 }, display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 5fr) minmax(0, 7fr)" }, gap: { xs: 4, md: 5 }, alignItems: "center" }}>
        <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 3 }}>
          {points.map((point, index) => (
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
          {<GuideLink />}
        </Box>
      </Box>
    </Box>
  )
}
