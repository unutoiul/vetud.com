"use client"

import { useRef } from "react"
import { motion, MotionConfig, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react"
import Box from "@mui/material/Box"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import Icon from "../brand/Icon"
import { ButtonLink, LocalizedNextLink } from "../common/links"
import { gutter } from "@/theme/tokens"

const FORMATS = [
  { number: "01", title: "Peptide pens", detail: "10 mg / 20 mg / 40 mg", href: "#catalog", icon: "molecule" as const },
  { number: "02", title: "Nasal sprays", detail: "Selank & Semax · 10 ml", href: "#sprays", icon: "leaf" as const },
]

export default function Hero() {
  const scene = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: scene, offset: ["start end", "end start"] })
  const position = useTransform(scrollYProgress, [0, 1], [22, -22])
  const y = useSpring(position, { stiffness: 80, damping: 25 })

  return (
    <MotionConfig reducedMotion="user">
      <Box ref={scene} component="section" aria-labelledby="hero-title" sx={{ px: gutter, pt: { xs: 4, md: 6 }, pb: { xs: 5, md: 7 }, position: "relative", overflow: "hidden", background: "radial-gradient(ellipse at 76% 45%, #e4eff2 0%, #f7f9fa 66%)" }}>
        <Box aria-hidden sx={{ position: "absolute", width: "55vw", height: "55vw", maxWidth: 920, maxHeight: 920, top: "-18%", right: "-8%", border: "1px solid rgba(63,109,133,.09)", borderRadius: "50%", pointerEvents: "none" }} />
        <Box sx={{ maxWidth: 1440, mx: "auto", display: "grid", gridTemplateColumns: { xs: "1fr", md: ".82fr 1.18fr" }, alignItems: "center", gap: { xs: 3.5, md: 1, lg: 3 }, position: "relative" }}>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8 }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: { xs: 2.5, md: 3.5 } }}>
              <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "brand.teal" }} />
              <Typography variant="eyebrow" sx={{ fontSize: 11, letterSpacing: ".14em", color: "brand.navySoft", textTransform: "uppercase" }}>VETUD / Peptide Series</Typography>
            </Stack>
            <Typography id="hero-title" component="h1" sx={{ fontSize: { xs: 48, sm: 64, md: 68, lg: 82 }, lineHeight: 1.04, letterSpacing: "-.055em", fontWeight: 500, mb: { xs: 2.5, md: 3 }, maxWidth: 570 }}>
              Pure science.<br /><Box component="span" sx={{ color: "brand.blue" }}>Clear perspective.</Box>
            </Typography>
            <Typography sx={{ maxWidth: 430, color: "text.secondary", fontSize: { xs: 15.5, md: 17 }, lineHeight: 1.85, mb: 3.5 }}>
              A focused collection, thoughtfully presented. Discover freeze-dried, dual-chamber pen kits and Selank and Semax in 10 ml spray formats.
            </Typography>
            <ButtonLink href="/shop" variant="contained" size="large" endIcon={<Icon name="arrowUpRight" />}>Explore the Peptide Series</ButtonLink>
            <Stack direction="row" spacing={2.5} useFlexGap sx={{ flexWrap: "wrap", mt: 3, alignItems: "center", color: "brand.navySoft" }}>
              <Stack direction="row" spacing={.75} sx={{ alignItems: "center" }}><Icon name="flask" sx={{ fontSize: 18, color: "brand.blue" }} /><Typography sx={{ fontSize: 11.5 }}>99% purity</Typography></Stack>
              <Stack direction="row" spacing={.75} sx={{ alignItems: "center" }}><Icon name="shield" sx={{ fontSize: 18, color: "brand.teal" }} /><Typography sx={{ fontSize: 11.5 }}>Lab tested for purity</Typography></Stack>
            </Stack>
          </motion.div>
          <Box component="figure" sx={{ m: 0, minWidth: 0, position: "relative" }}>
            <motion.div initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: .1 }} style={{ y: reduced ? 0 : y }}>
              <Box sx={{ position: "relative", aspectRatio: "4 / 3", overflow: "hidden", borderRadius: { xs: "70px 12px 12px 12px", md: "150px 18px 18px 18px" }, maskImage: { xs: "none", md: "linear-gradient(90deg, transparent 0%, #000 8%, #000 100%)" }, bgcolor: "#e5eff2" }}>
                <Image src="/images/vetud-complete-collection-alpine.png" alt="The complete VETUD Peptide Series: Retatrutide, Tirzepatide and Semaglutide pen kits with Selank and Semax sprays beside an alpine lake" fill preload sizes="(max-width: 900px) 100vw, 60vw" style={{ objectFit: "cover" }} />
              </Box>
            </motion.div>
            <Stack component="figcaption" direction="row" sx={{ alignItems: "center", gap: 1.5, justifyContent: "flex-end", mt: 2.25, color: "text.secondary", pr: 1 }}><Box sx={{ width: 32, height: 1, bgcolor: "#b3c9d3" }} /><Typography sx={{ fontSize: 9.5, letterSpacing: ".16em", textTransform: "uppercase" }}>One collection. Two formats.</Typography></Stack>
          </Box>
        </Box>
        <Box sx={{ maxWidth: 1440, mx: "auto", mt: { xs: 4, md: 5 }, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: { xs: 0, sm: 5 }, borderTop: "1px solid", borderColor: "divider" }}>
          {FORMATS.map((format) => <Box key={format.number} component={LocalizedNextLink} href={format.href} sx={{ display: "flex", alignItems: "center", gap: 2, py: 2.25, textDecoration: "none", borderBottom: { xs: "1px solid", sm: "none" }, borderColor: "divider", "&:hover .format-arrow": { transform: "translate(3px, -3px)" }, "&:hover": { color: "brand.blue" } }}>
            <Typography variant="mono" sx={{ color: "text.secondary", fontSize: 10 }}>{format.number}</Typography><Icon name={format.icon} sx={{ fontSize: 24, color: "brand.blue" }} /><Box sx={{ flex: 1 }}><Typography sx={{ fontSize: 14, fontWeight: 600 }}>{format.title}</Typography><Typography sx={{ fontSize: 11.5, color: "text.secondary", mt: .25 }}>{format.detail}</Typography></Box><Icon name="arrowUpRight" className="format-arrow" sx={{ fontSize: 17, transition: "transform 250ms ease", "@media (prefers-reduced-motion: reduce)": { transition: "none" } }} />
          </Box>)}
        </Box>
      </Box>
    </MotionConfig>
  )
}
