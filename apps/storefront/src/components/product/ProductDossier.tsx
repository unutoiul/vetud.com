import { useContentTranslator } from "@/i18n/use-content-translator"
import { useTranslations } from "next-intl"
import { translateAction } from "@/i18n/actions"
import Box from "@mui/material/Box"
import type { ReactNode } from "react"
import Typography from "@mui/material/Typography"
import Icon from "../brand/Icon"
import ProductSpecifications, { type ProductSpecification } from "./ProductSpecifications"
import { AppLink } from "../common/links"
import EvidenceLadder from "../learn/EvidenceLadder"
import StatusBadge from "../learn/StatusBadge"
import StudyResults from "../learn/StudyResults"
import { EVIDENCE_STEPS } from "@/content/learn/categories"
import type { ProductOverview } from "@/content/product-overview"
import type { ProductMeta } from "@/lib/product"
import { SITE } from "@/lib/config"

const sections = [
  { id: "research-overview", label: "Research overview" },
  { id: "specifications", label: "Specifications" },
  { id: "storage", label: "Storage & handling" },
]
const sectionStyle = { pt: { xs: 4, md: 5 }, pb: { xs: 4, md: 5 }, borderTop: "1px solid", borderColor: "divider", scrollMarginTop: 115 }
const bodyStyle = { fontSize: 14, lineHeight: 1.95, color: "text.secondary", maxWidth: 800 }

/**
 * The plain-language overview from the learning library: what it is, how strong the evidence is,
 * published results (framed as studies of the compound, not of this material), what isn't known
 * yet, risks, and sources.
 */
function Overview({ overview }: { overview: ProductOverview }) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const heading = { component: "h3", sx: { fontSize: 17, fontWeight: 650, color: "text.primary", mb: 1.25 } } as const
  const list = { m: 0, pl: 2.5, maxWidth: 800, "& li": { ...bodyStyle, fontSize: 15, lineHeight: 1.8, mb: .75 } }
  return <>
    <Typography sx={{ ...bodyStyle, color: "text.primary", fontSize: 18, lineHeight: 1.65, mb: 3 }}>{ct(overview.summary)}</Typography>
    {overview.status || overview.evidence ? <Box sx={{ mb: 3.5, p: { xs: 2, md: 2.5 }, bgcolor: "brand.mintWash", borderRadius: "8px", maxWidth: 800, display: "grid", gap: 2 }}>
      {overview.status ? <Box>
        <StatusBadge status={overview.status.id} size="small" />
        <Typography sx={{ ...bodyStyle, mt: 1, fontSize: 14, lineHeight: 1.75 }}>{ct(overview.status.note)}</Typography>
      </Box> : null}
      {overview.evidence ? <EvidenceLadder evidence={overview.evidence} name={overview.name} /> : null}
    </Box> : null}
    <Box sx={{ display: "grid", gap: 3.5 }}>
      {overview.sections.map(section => <Box key={section.title}><Typography {...heading}>{ct(section.title)}</Typography><Typography sx={{ ...bodyStyle, fontSize: 15.5, lineHeight: 1.8 }}>{ct(section.text)}</Typography></Box>)}
      {overview.results.length || overview.findings.length ? <Box><Typography {...heading}>{ct("What studies found")}</Typography>
        {overview.results.length ? <StudyResults results={overview.results} sources={overview.sources} framing={`These results come from published studies of ${overview.name}, not from this research material.`} /> : null}
        {overview.findings.length ? <Box component="ul" sx={{ ...list, mt: overview.results.length ? 2.5 : 0 }}>{overview.findings.map(finding => <li key={finding}>{ct(finding)}</li>)}</Box> : null}
      </Box> : null}
      {overview.components.length ? <Box><Typography {...heading}>{ct("What's in the blend")}</Typography>
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, maxWidth: 800, display: "grid", gap: 1.5 }}>{overview.components.map(component => <Box component="li" key={component.href} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: "8px" }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", columnGap: 1.5, rowGap: .5 }}>
            <AppLink href={component.href} sx={{ fontSize: 15.5, fontWeight: 650 }}>{ct(component.name)}</AppLink>
            {component.evidence ? <Typography component="span" sx={{ fontSize: 12.5, color: "text.secondary" }}>{ct.rich("Evidence: {v0}", { v0: ct(EVIDENCE_STEPS.find(step => step.id === component.evidence)?.label) }, {  })}</Typography> : null}
          </Box>
          <Typography sx={{ ...bodyStyle, fontSize: 14.5, lineHeight: 1.7, mt: .5 }}>{ct(component.text)}</Typography>
        </Box>)}</Box>
      </Box> : null}
      {overview.unknowns.length ? <Box><Typography {...heading}>{ct("What we don't know yet")}</Typography><Box component="ul" sx={list}>{overview.unknowns.map(item => <li key={item}>{ct(item)}</li>)}</Box></Box> : null}
      {overview.risks.length ? <Box><Typography {...heading}>{ct("Known risks")}</Typography><Box component="ul" sx={list}>{overview.risks.map(item => <li key={item}>{ct(item)}</li>)}</Box></Box> : null}
    </Box>
    {overview.sources.length ? <>
      <Typography variant="mono" component="h3" sx={{ mt: 3.5, mb: 1.5, fontSize: 10, color: "brand.blue", letterSpacing: ".12em" }}>{ct("SOURCES")}</Typography>
      <Box sx={{ display: "grid", gap: 1.75 }}>{overview.sources.map(source => <Box key={source.url} component="a" href={source.url} target="_blank" rel="noopener noreferrer" sx={{ display: "flex", gap: 2, alignItems: "flex-start", textDecoration: "none", "&:hover": { color: "brand.blue" } }}><Icon name="document" sx={{ color: "brand.blue", fontSize: 20, mt: .3, flexShrink: 0 }} /><Box><Typography sx={{ fontSize: 13, lineHeight: 1.7, fontWeight: 600 }}>{ct(source.title)} ↗</Typography><Typography sx={{ mt: .25, fontSize: 11.5, color: "text.secondary" }}>{ct(source.detail)}</Typography></Box></Box>)}</Box>
    </> : null}
    {overview.guides.length === 1 ? <AppLink href={`/learn/${overview.guides[0].slug}`} sx={{ display: "inline-flex", alignItems: "center", gap: 1, mt: 3, minHeight: 44, fontSize: 14, fontWeight: 600 }}>{act("fullGuide", { product: ct(overview.guides[0].name) })} <Icon name="arrowRight" sx={{ fontSize: 16 }} /></AppLink> : null}
  </>
}

export default function ProductDossier({ overview, description, specs, skus, meta, title, formats, formatsLabel = "Vial, dual-chamber or pen kit" }: {
  overview?: ProductOverview; description?: string | null; specs: ProductSpecification[]; skus?: string; meta: ProductMeta; title: string
  /** The "Dual-chamber pen or vial?" part, first in the dossier, for products sold in both formats. */
  formats?: ReactNode
  /** The menu entry for `formats`. */
  formatsLabel?: string
}) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const items = formats ? [{ id: "formats", label: formatsLabel }, ...sections] : sections
  return <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "230px minmax(0, 1fr)" }, gap: { xs: 3, md: 8 }, mt: { xs: 5, md: 9 } }}>
    <Box component="nav" aria-label={act("productDossier")} sx={{ minWidth: 0, width: "100%", alignSelf: "start", position: { md: "sticky" }, top: 125 }}>
      <Typography variant="mono" component="p" sx={{ fontSize: 10, letterSpacing: ".14em", color: "brand.blue", mb: 2 }}>{ct("THE PRODUCT DOSSIER")}</Typography>
      <Box sx={{ display: "flex", flexDirection: { xs: "row", md: "column" }, overflowX: "auto", gap: { xs: 2.5, md: 0 }, pb: 1 }}>{items.map((section, i) => <Box key={section.id} component="a" href={`#${section.id}`} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.3, textDecoration: "none", fontSize: 12, whiteSpace: "nowrap", color: "text.secondary", "&:hover": { color: "brand.blue" } }}><Typography variant="mono" sx={{ fontSize: 9, color: "brand.blue" }}>0{ct(i + 1)}</Typography>{translateAction(act, section.label)}</Box>)}</Box>
    </Box>
    <Box sx={{ minWidth: 0 }}>
      {formats ? <Box component="section" id="formats" aria-labelledby="formats-heading" sx={sectionStyle}>{ct(formats)}</Box> : null}
      <Box component="section" id="research-overview" aria-labelledby="research-heading" sx={sectionStyle}>
        <Typography component="h2" variant="h3" id="research-heading" sx={{ mb: 2.5 }}>{ct.rich("Understanding {v0}.", { v0: ct(overview?.name ?? title) }, {  })}</Typography>
        {overview ? <Overview overview={overview} /> : <Typography sx={{ ...bodyStyle, whiteSpace: "pre-line" }}>{ct(description ?? "Consult the specifications and lot documentation for the identity and composition of this research material. Contact the team if further analytical information is needed.")}</Typography>}
        {meta.notice?.research
          ? <Typography sx={{ ...bodyStyle, fontSize: 11.5, mt: 3 }}>{ct.rich("Scientific background concerns the named molecule. Batch composition and analytical results must be established from the product documentation. {v0}", { v0: ct(SITE.ruoNotice) }, {  })}</Typography>
          : meta.notice?.text ? <Typography sx={{ ...bodyStyle, fontSize: 11.5, mt: 3 }}>{ct(meta.notice.text)}</Typography> : null}
      </Box>
      <Box component="section" id="specifications" aria-labelledby="specifications-heading" sx={sectionStyle}>
        <ProductSpecifications specs={specs} skus={skus} />
      </Box>
      <Box component="section" id="storage" aria-labelledby="storage-heading" sx={sectionStyle}>
        <Typography component="h2" variant="h3" id="storage-heading" sx={{ mb: 2.5 }}>{ct("Preserve the integrity of your material.")}</Typography>
        {[{ label: "Storage conditions", value: meta.storage ?? "Follow the storage conditions supplied on the batch label and certificate." }, { label: "Handling", value: meta.handling ?? "Keep the material in its original, sealed packaging. Follow your laboratory’s handling procedures and the supplied product documentation." }, { label: "Stability & shelf life", value: meta.stability ?? "Refer to the lot-specific expiry date and stability documentation. Shelf life should not be inferred from the product name alone." }].map(item => <Box key={item.label} sx={{ display: "flex", gap: 2, mb: 2.5 }}><Icon name={item.label === "Storage conditions" ? "snowflake" : item.label === "Handling" ? "package" : "clock"} sx={{ color: "brand.blue", fontSize: 21, mt: .3, flexShrink: 0 }} /><Box><Typography component="h3" sx={{ fontSize: 13, fontWeight: 600, mb: .5 }}>{ct(item.label)}</Typography><Typography sx={bodyStyle}>{ct(item.value)}</Typography></Box></Box>)}
        <Typography sx={{ ...bodyStyle, fontSize: 12 }}>{ct("For solvent compatibility or preparation specifications, request the manufacturer’s batch documentation. Research protocols should be established by qualified laboratory personnel.")}</Typography>
      </Box>
    </Box>
  </Box>
}
