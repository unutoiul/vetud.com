import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { useContentTranslator } from "@/i18n/use-content-translator"
import Icon from "../brand/Icon"

export type ProductSpecification = { label: string; value: string }

const FORMAT_LABELS = new Set(["Pen kit box", "Dual-chamber vial", "Dual-chamber pen", "Vial", "Nasal spray", "Available amounts", "Formats and amounts"])

/** A readable material record; every value comes from the product's existing specifications. */
export default function ProductSpecifications({ specs, skus }: { specs: ProductSpecification[]; skus?: string }) {
  const ct = useContentTranslator()
  const formats = specs.filter(spec => FORMAT_LABELS.has(spec.label))
  const details = specs.filter(spec => !FORMAT_LABELS.has(spec.label))

  return <>
    <Typography component="h2" id="specifications-heading" sx={{ mb: 3, fontSize: { xs: 28, sm: 34 }, fontWeight: 550, lineHeight: 1.2, letterSpacing: "-.04em", color: "brand.navy" }}>
      {ct("The material, in detail.")}
    </Typography>
    <Box sx={{ border: "1px solid", borderColor: "brand.lineStrong", borderRadius: "12px", overflow: "hidden" }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: formats.length ? "minmax(0, 1.15fr) minmax(0, 1fr)" : "minmax(0, 1fr)" } }}>
        <Box component="dl" sx={{ m: 0, minWidth: 0, px: { xs: 2.5, sm: 3.5 }, py: 1 }}>
          {details.map(spec => <Box key={spec.label} sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "minmax(0, .85fr) minmax(0, 1.15fr)", lg: formats.length ? "minmax(0, 1fr)" : "minmax(0, .85fr) minmax(0, 1.15fr)" }, gap: .75, columnGap: 2.5, py: 2.25, borderBottom: "1px solid", borderColor: "divider", "&:last-child": { borderBottom: 0 } }}>
            <Typography component="dt" sx={{ fontSize: 13.5, color: "brand.navySoft", lineHeight: 1.6 }}>{ct(spec.label)}</Typography>
            <Typography component="dd" sx={{ m: 0, fontSize: 15.5, fontWeight: spec.label === "Product code" ? 650 : 500, color: "brand.ink", lineHeight: 1.65, overflowWrap: "anywhere", whiteSpace: "pre-line", fontVariantNumeric: "tabular-nums" }}>{ct(spec.value)}</Typography>
          </Box>)}
        </Box>
        {formats.length ? <Box sx={{ minWidth: 0, p: { xs: 2.5, sm: 3.5 }, bgcolor: "brand.mintWash", borderStyle: "solid", borderLeftWidth: { xs: 0, lg: 1 }, borderTopWidth: { xs: 1, lg: 0 }, borderRightWidth: 0, borderBottomWidth: 0, borderColor: "divider" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: .75 }}>
            <Icon name="package" sx={{ fontSize: 21, color: "brand.blue", flexShrink: 0 }} />
            <Typography component="h3" sx={{ fontSize: 16, lineHeight: 1.5, fontWeight: 650, color: "brand.navy" }}>{ct("Formats and amounts")}</Typography>
          </Box>
          <Box component="dl" sx={{ m: 0 }}>{formats.map(spec => <Box key={spec.label} sx={{ py: 2.25, borderBottom: "1px solid", borderColor: "brand.lineStrong", "&:last-child": { borderBottom: 0, pb: 0 } }}>
            <Typography component="dt" sx={{ fontSize: 14, fontWeight: 550, color: "brand.navySoft", mb: .75 }}>{ct(spec.label)}</Typography>
            <Typography component="dd" sx={{ m: 0, fontSize: { xs: 17, sm: 18 }, fontWeight: 600, lineHeight: 1.65, color: "brand.navy", overflowWrap: "anywhere", whiteSpace: "pre-line", fontVariantNumeric: "tabular-nums" }}>{ct(spec.value)}</Typography>
          </Box>)}</Box>
        </Box> : null}
      </Box>
      {skus ? <Box sx={{ px: { xs: 2.5, sm: 3.5 }, py: 2, borderTop: "1px solid", borderColor: "divider", bgcolor: "brand.paper" }}>
        <Typography component="p" sx={{ m: 0, fontSize: 12, lineHeight: 1.8, color: "brand.navySoft", overflowWrap: "anywhere" }}><Box component="span" sx={{ fontWeight: 650, mr: 1 }}>{ct("SKU")}</Box>{skus}</Typography>
      </Box> : null}
    </Box>
  </>
}
