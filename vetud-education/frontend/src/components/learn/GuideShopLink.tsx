import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"
import { getContentTranslator } from "@/i18n/server-content"
import { guideProductUrl } from "@/lib/guide-products"
import Icon from "../brand/Icon"

/** The guide's one link to the separate shop, shown only when the shop carries this peptide. */
export default async function GuideShopLink({ slug, name }: { slug: string; name: string }) {
  const href = guideProductUrl(slug)
  if (!href) return null
  const ct = await getContentTranslator()
  return (
    <Box id="research-shop" sx={{ scrollMarginTop: 8, p: { xs: 2.5, md: 3 }, border: "1px solid", borderColor: "divider", borderRadius: "10px" }}>
      <Typography component="h2" sx={{ fontSize: 18, fontWeight: 650, color: "brand.navy" }}>{ct("Laboratory research material")}</Typography>
      <Typography sx={{ mt: .75, fontSize: 15, lineHeight: 1.7, color: "brand.navySoft" }}>
        {ct.template("The VETUD shop lists {v0} as a research material for laboratory use only. It is separate from any approved medicine or trial formulation.", { v0: name })}
      </Typography>
      <Button href={href} variant="outlined" endIcon={<Icon name="arrowUpRight" />} sx={{ mt: 2 }}>{ct("View in the shop")}</Button>
    </Box>
  )
}
