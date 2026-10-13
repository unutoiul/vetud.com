"use client"

import type { HttpTypes } from "@medusajs/types"
import { motion, MotionConfig } from "motion/react"
import Box from "@mui/material/Box"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import Icon from "../brand/Icon"
import { LocalizedNextLink } from "../common/links"
import Section from "../common/Section"
import { cheapestPrice, formatMoney, isProductInStock } from "@/lib/product"

export default function SpraySpotlight({ products }: { products: HttpTypes.StoreProduct[] }) {
  if (!products.length) return null
  return (
    <MotionConfig reducedMotion="user">
      <Section tone="paper" id="sprays" sx={{ pt: { xs: 6, md: 9 }, pb: { xs: 7, md: 11 } }}>
        <Stack direction={{ xs: "column", md: "row" }} sx={{ gap: 3, alignItems: { md: "flex-end" }, justifyContent: "space-between", mb: { xs: 4, md: 6 } }}>
          <Box><Typography variant="eyebrow" sx={{ color: "brand.teal", letterSpacing: ".12em", fontSize: 10.5, textTransform: "uppercase" }}>02 / The spray collection</Typography><Typography variant="h2" sx={{ mt: 2 }}>A different format.<br />The same clear perspective.</Typography></Box>
          <Typography sx={{ maxWidth: 350, color: "text.secondary", fontSize: 14 }}>Selank and Semax, each in a 10 ml spray bottle. Find the format and ingredient details on each product page.</Typography>
        </Stack>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 5, md: 5, lg: 7 }, alignItems: "start" }}>
          {products.map((product, index) => {
            const price = cheapestPrice(product)
            const inStock = isProductInStock(product)
            return <motion.article key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .15 }} transition={{ duration: .7, delay: index * .08 }} style={{ minWidth: 0 }}>
              <Box sx={{ mt: { xs: 0, md: index === 1 ? 5 : 0 } }}>
                <Box component={LocalizedNextLink} href={`/products/${product.handle}`} aria-label={`Explore ${product.title}`} sx={{ display: "block", position: "relative", aspectRatio: "4 / 3", overflow: "hidden", borderRadius: "24px 24px 24px 4px", bgcolor: "#e5eef0", "& img": { transition: "transform 650ms cubic-bezier(.22,1,.36,1)" }, "&:hover img": { transform: "scale(1.025)" }, "@media (prefers-reduced-motion: reduce)": { "& img": { transition: "none" }, "&:hover img": { transform: "none" } } }}>
                  {product.thumbnail && <Image src={product.thumbnail} alt={`${product.title} and matching box in an alpine landscape`} fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: "cover" }} />}
                </Box>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 2, mt: 2.5, pb: 2.5, borderBottom: "1px solid", borderColor: "divider" }}>
                  <Box><Typography sx={{ fontSize: 10, letterSpacing: ".12em", color: "text.secondary", textTransform: "uppercase", mb: .5 }}>VETUD / 10 ml</Typography><Typography component="h3" sx={{ fontSize: { xs: 23, md: 28 }, letterSpacing: "-.035em", fontWeight: 500 }}>{product.title}</Typography><Typography sx={{ fontSize: 11.5, color: inStock ? "brand.teal" : "text.secondary", mt: .5 }}>{inStock ? "In stock" : "Sold out"}</Typography></Box>
                  <Stack direction="row" sx={{ gap: { xs: 2, md: 3 }, alignItems: "center", flexShrink: 0 }}>{price && <Typography sx={{ fontSize: 16, fontWeight: 600 }}>{formatMoney(price.amount, price.currencyCode)}</Typography>}<Box component={LocalizedNextLink} href={`/products/${product.handle}`} aria-label={`View ${product.title} details`} sx={{ display: "grid", placeItems: "center", width: 44, height: 44, border: "1px solid", borderColor: "brand.lineStrong", borderRadius: "50%", "&:hover": { bgcolor: "brand.mintLight" } }}><Icon name="arrowUpRight" sx={{ fontSize: 18 }} /></Box></Stack>
                </Stack>
              </Box>
            </motion.article>
          })}
        </Box>
      </Section>
    </MotionConfig>
  )
}
