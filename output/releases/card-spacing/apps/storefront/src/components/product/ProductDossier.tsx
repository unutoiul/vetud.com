import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableRow from "@mui/material/TableRow"
import Icon from "../brand/Icon"
import { AppLink } from "../common/links"
import LotTable from "./LotTable"
import type { ProductResearch } from "@/content/product-research"
import { formatMoney, type ProductMeta } from "@/lib/product"
import { SITE } from "@/lib/config"

const sections = [
  { id: "research-overview", label: "Research overview" },
  { id: "specifications", label: "Specifications" },
  { id: "quality", label: "Quality & certificates" },
  { id: "storage", label: "Storage & handling" },
  { id: "delivery", label: "Delivery & support" },
]
const sectionStyle = { pt: { xs: 4, md: 5 }, pb: { xs: 4, md: 5 }, borderTop: "1px solid", borderColor: "divider", scrollMarginTop: 115 }
const bodyStyle = { fontSize: 14, lineHeight: 1.95, color: "text.secondary", maxWidth: 800 }

export default function ProductDossier({ profile, description, specs, meta, title, currencyCode, freeShippingThreshold }: {
  profile?: ProductResearch; description?: string | null; specs: { label: string; value: string }[]; meta: ProductMeta; title: string; currencyCode: string; freeShippingThreshold?: number
}) {
  return <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "230px minmax(0, 1fr)" }, gap: { xs: 3, md: 8 }, mt: { xs: 5, md: 9 } }}>
    <Box component="nav" aria-label="Product dossier" sx={{ minWidth: 0, width: "100%", alignSelf: "start", position: { md: "sticky" }, top: 125 }}>
      <Typography variant="mono" component="p" sx={{ fontSize: 10, letterSpacing: ".14em", color: "brand.blue", mb: 2 }}>THE PRODUCT DOSSIER</Typography>
      <Box sx={{ display: "flex", flexDirection: { xs: "row", md: "column" }, overflowX: "auto", gap: { xs: 2.5, md: 0 }, pb: 1 }}>{sections.map((section, i) => <Box key={section.id} component="a" href={`#${section.id}`} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.3, textDecoration: "none", fontSize: 12, whiteSpace: "nowrap", color: "text.secondary", "&:hover": { color: "brand.blue" } }}><Typography variant="mono" sx={{ fontSize: 9, color: "brand.blue" }}>0{i + 1}</Typography>{section.label}</Box>)}</Box>
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Box component="section" id="research-overview" aria-labelledby="research-heading" sx={sectionStyle}>
        <Typography component="h2" variant="h3" id="research-heading" sx={{ mb: 2.5 }}>Understanding {profile?.name ?? title}.</Typography>
        {profile ? <>
          <Typography sx={{ ...bodyStyle, color: "text.primary", fontSize: 16, mb: 2 }}>{profile.summary}</Typography>
          <Typography sx={bodyStyle}>{profile.background}</Typography>
          <Box sx={{ mt: 3 }}>{profile.topics.map((topic, i) => <Box key={topic.title} sx={{ display: "flex", gap: 2, py: 2, borderBottom: "1px solid", borderColor: "divider" }}><Typography variant="mono" sx={{ fontSize: 10, color: "brand.blue", pt: .7 }}>0{i + 1}</Typography><Box><Typography component="h3" sx={{ fontSize: 15, fontWeight: 600, mb: .75 }}>{topic.title}</Typography><Typography sx={bodyStyle}>{topic.text}</Typography></Box></Box>)}</Box>
          <Box sx={{ mt: 3.5, p: 3, bgcolor: "brand.mintWash", borderLeft: "2px solid", borderColor: "brand.blue" }}><Typography sx={{ fontSize: 12, fontWeight: 600, mb: 1 }}>Reading the evidence</Typography><Typography sx={{ ...bodyStyle, fontSize: 12.5 }}>{profile.limitation}</Typography></Box>
          <Typography variant="mono" component="h3" sx={{ mt: 3.5, mb: 1.5, fontSize: 10, color: "brand.blue", letterSpacing: ".12em" }}>SOURCE PUBLICATION</Typography>
          <Box component="a" href={profile.source.url} target="_blank" rel="noopener noreferrer" sx={{ display: "flex", gap: 2, alignItems: "flex-start", textDecoration: "none", "&:hover": { color: "brand.blue" } }}><Icon name="document" sx={{ color: "brand.blue", fontSize: 20, mt: .3, flexShrink: 0 }} /><Box><Typography sx={{ fontSize: 13, lineHeight: 1.7, fontWeight: 600 }}>{profile.source.title} ↗</Typography><Typography sx={{ mt: .5, fontSize: 11.5, color: "text.secondary" }}>{profile.source.journal} · View on PubMed</Typography></Box></Box>
        </> : <Typography sx={{ ...bodyStyle, whiteSpace: "pre-line" }}>{description ?? "Consult the specifications and lot documentation for the identity and composition of this research material. Contact the team if further analytical information is needed."}</Typography>}
        <Typography sx={{ ...bodyStyle, fontSize: 11.5, mt: 3 }}>Scientific background concerns the named molecule. Batch composition and analytical results must be established from the product documentation. {SITE.ruoNotice}</Typography>
      </Box>
      <Box component="section" id="specifications" aria-labelledby="specifications-heading" sx={sectionStyle}>
        <Typography component="h2" variant="h3" id="specifications-heading" sx={{ mb: 2.5 }}>The material, in detail.</Typography>
        <Table size="small" aria-label={`${title} specifications`}><TableBody>{[...(profile ? [{ label: "Research classification", value: profile.classification }] : []), ...specs].map(spec => <TableRow key={spec.label}><TableCell component="th" scope="row" sx={{ color: "text.secondary", fontSize: 12, width: { xs: "38%", sm: "30%" }, pl: 0, verticalAlign: "top" }}>{spec.label}</TableCell><TableCell sx={{ fontSize: 13, pr: 0, overflowWrap: "anywhere" }}>{spec.value}</TableCell></TableRow>)}</TableBody></Table>
      </Box>
      <Box component="section" id="quality" aria-labelledby="quality-heading" sx={sectionStyle}>
        <Typography component="h2" variant="h3" id="quality-heading" sx={{ mb: 2.5 }}>Know the batch behind the label.</Typography>
        <Typography sx={{ ...bodyStyle, mb: 2.5 }}>Use the lot number on your packaging to match the material to its analytical documentation. A purity percentage describes a reported analytical measurement; consult the certificate for the method, identity results and scope of testing.</Typography>
        <LotTable lots={meta.lots} productTitle={title} />
        <AppLink href="/documentation" sx={{ display: "inline-flex", alignItems: "center", gap: 1, mt: 2.5, fontSize: 12 }}>Open the lot register <Icon name="arrowUpRight" sx={{ fontSize: 16 }} /></AppLink>
      </Box>
      <Box component="section" id="storage" aria-labelledby="storage-heading" sx={sectionStyle}>
        <Typography component="h2" variant="h3" id="storage-heading" sx={{ mb: 2.5 }}>Preserve the integrity of your material.</Typography>
        {[{ label: "Storage conditions", value: meta.storage ?? "Follow the storage conditions supplied on the batch label and certificate." }, { label: "Handling", value: meta.handling ?? "Keep the material in its original, sealed packaging. Follow your laboratory’s handling procedures and the supplied product documentation." }, { label: "Stability & shelf life", value: meta.stability ?? "Refer to the lot-specific expiry date and stability documentation. Shelf life should not be inferred from the product name alone." }].map(item => <Box key={item.label} sx={{ display: "flex", gap: 2, mb: 2.5 }}><Icon name={item.label === "Storage conditions" ? "snowflake" : item.label === "Handling" ? "package" : "clock"} sx={{ color: "brand.blue", fontSize: 21, mt: .3, flexShrink: 0 }} /><Box><Typography component="h3" sx={{ fontSize: 13, fontWeight: 600, mb: .5 }}>{item.label}</Typography><Typography sx={bodyStyle}>{item.value}</Typography></Box></Box>)}
        <Typography sx={{ ...bodyStyle, fontSize: 12 }}>For solvent compatibility or preparation specifications, request the manufacturer’s batch documentation. Research protocols should be established by qualified laboratory personnel.</Typography>
      </Box>
      <Box component="section" id="delivery" aria-labelledby="delivery-heading" sx={sectionStyle}>
        <Typography component="h2" variant="h3" id="delivery-heading" sx={{ mb: 2.5 }}>From our collection to your laboratory.</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mb: 3 }}>
          <Box sx={{ p: 3, border: "1px solid", borderColor: "divider", borderRadius: "5px" }}><Icon name="truck" sx={{ color: "brand.blue", mb: 1.5 }} /><Typography component="h3" sx={{ fontSize: 14, fontWeight: 600 }}>Standard delivery</Typography><Typography sx={{ ...bodyStyle, mt: .75 }}>3–5 business days, tracked.{freeShippingThreshold ? ` Free on orders over ${formatMoney(freeShippingThreshold, currencyCode, { whole: true })}.` : ""}</Typography></Box>
          <Box sx={{ p: 3, border: "1px solid", borderColor: "divider", borderRadius: "5px" }}><Icon name="clock" sx={{ color: "brand.blue", mb: 1.5 }} /><Typography component="h3" sx={{ fontSize: 14, fontWeight: 600 }}>Express delivery</Typography><Typography sx={{ ...bodyStyle, mt: .75 }}>1–2 business days, tracked. Available services and charges appear at checkout.</Typography></Box>
        </Box>
        <Typography sx={bodyStyle}>Orders dispatch after payment confirmation. Products travel in protective packaging; follow the supplied storage requirements when they arrive. See our <AppLink href="/legal/shipping">shipping policy</AppLink> and <AppLink href="/legal/returns">returns policy</AppLink> for full details.</Typography>
        <AppLink href={`/contact?subject=${encodeURIComponent(`Product enquiry: ${title}`)}`} sx={{ display: "inline-flex", alignItems: "center", gap: 1, mt: 2.5, fontSize: 13 }}>Ask the VETUD team about this product <Icon name="arrowUpRight" sx={{ fontSize: 16 }} /></AppLink>
      </Box>
    </Box>
  </Box>
}
