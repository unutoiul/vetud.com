"use client"

import { motion, MotionConfig } from "motion/react"
import Box from "@mui/material/Box"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import Icon from "../brand/Icon"
import { ButtonLink } from "../common/links"
import HeroCarousel from "./HeroCarousel"
import { gutter } from "@/theme/tokens"

const DETAILS = [
  { icon: "flask" as const, title: "99% purity", text: "Lab tested for purity" },
  { icon: "snowflake" as const, title: "Freeze-dried", text: "Peptide powder in our pens" },
  { icon: "molecule" as const, title: "Dual chamber", text: "Powder + separate BAC water" },
]

export default function Hero() {
  return (
    <MotionConfig reducedMotion="user">
      <Box component="section" aria-labelledby="hero-title" sx={{ px: gutter, pt: { xs: 4, md: 6 }, pb: { xs: 5, md: 8 }, overflow: "hidden", background: "radial-gradient(ellipse at 85% 40%, #e3eef2 0%, transparent 60%)" }}>
        <Box sx={{ maxWidth: 1360, mx: "auto", display: "grid", gridTemplateColumns: { xs: "1fr", md: ".9fr 1.1fr" }, gap: { xs: 4, md: 5, lg: 7 }, alignItems: "center" }}>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 3 }}>
              <Icon name="molecule" sx={{ color: "brand.blue", fontSize: 20 }} />
              <Typography variant="eyebrow" sx={{ color: "brand.navySoft" }}>VETUD · Peptide Series</Typography>
            </Stack>
            <Typography id="hero-title" component="h1" sx={{ fontSize: { xs: 48, sm: 62, md: 64, lg: 78 }, lineHeight: 1.05, letterSpacing: "-.055em", fontWeight: 500, mb: 3 }}>
              Pure science.<br /><Box component="span" sx={{ color: "brand.blue" }}>A clearer view.</Box>
            </Typography>
            <Typography sx={{ maxWidth: 450, color: "text.secondary", fontSize: { xs: 16, md: 18 }, lineHeight: 1.8, mb: 3.5 }}>
              Meet our Peptide Series. Three freeze-dried, dual-chamber pen kits in 10 mg, 20 mg and 40 mg, alongside Selank and Semax in 10 ml spray formats.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ alignItems: { xs: "stretch", sm: "center" } }}>
              <ButtonLink href="/shop" variant="contained" size="large" endIcon={<Icon name="arrowUpRight" />}>Explore the collection</ButtonLink>
              <ButtonLink href="/standards" variant="text" size="large" sx={{ color: "brand.navySoft" }}>Our standards</ButtonLink>
            </Stack>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: { xs: 1.5, sm: 3 }, borderTop: "1px solid", borderColor: "divider", pt: 3, mt: 4 }}>
              {DETAILS.map((detail, index) => <motion.div key={detail.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 + index * .1, duration: .6 }}>
                <Icon name={detail.icon} sx={{ color: "brand.blue", fontSize: 25, mb: 1 }} />
                <Typography sx={{ fontSize: 13, fontWeight: 650 }}>{detail.title}</Typography>
                <Typography sx={{ fontSize: 11.5, color: "text.secondary", mt: .5, lineHeight: 1.6 }}>{detail.text}</Typography>
              </motion.div>)}
            </Box>
          </motion.div>
          <HeroCarousel />
        </Box>
      </Box>
    </MotionConfig>
  )
}
