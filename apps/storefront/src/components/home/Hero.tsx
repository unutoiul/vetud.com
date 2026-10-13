"use client"

import { useRef, useState } from "react"
import { motion, MotionConfig, useInView, useReducedMotion } from "motion/react"
import Box from "@mui/material/Box"
import IconButton from "@mui/material/IconButton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import Icon from "../brand/Icon"
import { ButtonLink, LocalizedNextLink } from "../common/links"
import { gutter } from "@/theme/tokens"

const DETAILS = [
  { icon: "flask" as const, title: "99% purity", text: "Lab tested for purity" },
  { icon: "snowflake" as const, title: "Freeze-dried", text: "Peptide powder in our pens" },
  { icon: "molecule" as const, title: "Dual chamber", text: "Powder + separate BAC water" },
]

export default function Hero() {
  const scene = useRef<HTMLDivElement>(null)
  const visible = useInView(scene)
  const reduced = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const moving = visible && !reduced && !paused

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
          <Box ref={scene} sx={{ position: "relative", height: { xs: 410, sm: 550, md: 610 }, isolation: "isolate" }}>
            <motion.div aria-hidden="true" animate={moving ? { rotate: [0, 360] } : {}} transition={{ duration: 100, repeat: Infinity, ease: "linear" }} style={{ position: "absolute", inset: "5% 3%", border: "1px solid rgba(52,112,144,.12)", borderRadius: "50%" }} />
            <Box sx={{ position: "absolute", top: "10%", left: "4%", width: "90%", zIndex: 2 }}>
              <motion.div animate={moving ? { y: [0, -12, 0], rotate: [-2, 0, -2] } : { y: 0, rotate: -2 }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} whileHover={reduced ? {} : { scale: 1.025 }}>
                <Box component={LocalizedNextLink} href="/shop" sx={{ display: "block", p: .75, borderRadius: 4, bgcolor: "#fff", boxShadow: "0 28px 60px rgba(23,53,75,.12)", textDecoration: "none", overflow: "hidden" }}>
                  <Box sx={{ position: "relative", aspectRatio: "4 / 3", borderRadius: 3.25, overflow: "hidden" }}><Image src="/images/vetud-pen-collection-alpine.png" alt="VETUD Retatrutide, Semaglutide and Tirzepatide pen kits beside an alpine lake" fill priority sizes="(max-width: 900px) 90vw, 48vw" style={{ objectFit: "cover" }} /></Box>
                </Box>
              </motion.div>
            </Box>
            <Box sx={{ position: "absolute", bottom: "1%", left: 0, width: "34%", zIndex: 3 }}>
              <motion.div animate={moving ? { y: [0, 10, 0], rotate: [-6, -3, -6] } : { y: 0, rotate: -6 }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}>
                <Box component={LocalizedNextLink} href="/products/selank" sx={{ display: "block", p: .65, borderRadius: 3, bgcolor: "white", boxShadow: "0 16px 40px rgba(23,53,75,.12)", textDecoration: "none" }}>
                  <Box sx={{ position: "relative", aspectRatio: "4 / 5", borderRadius: 2.4, overflow: "hidden" }}><Image src="/images/vetud-selank-alpine-01.png" alt="Selank 10 ml spray with matching alpine packaging" fill sizes="(max-width: 900px) 30vw, 18vw" style={{ objectFit: "cover" }} /></Box>
                  <Typography sx={{ p: 1, fontSize: 11.5, fontWeight: 600 }}>Selank · 10 ml</Typography>
                </Box>
              </motion.div>
            </Box>
            <Box sx={{ position: "absolute", bottom: "3%", right: 0, width: "48%", zIndex: 1 }}>
              <motion.div animate={moving ? { y: [0, -8, 0], rotate: [5, 3, 5] } : { y: 0, rotate: 5 }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}>
                <Box sx={{ position: "relative", aspectRatio: "4 / 3", borderRadius: 3, overflow: "hidden", border: "5px solid #fff", boxShadow: "0 18px 50px rgba(23,53,75,.1)" }}><Image src="/images/vetud-glacial-detail.png" alt="Clear glacial ice at the edge of a blue alpine lake" fill sizes="(max-width: 900px) 45vw, 25vw" style={{ objectFit: "cover" }} /></Box>
              </motion.div>
            </Box>
            <Box sx={{ position: "absolute", top: "3%", right: 0, zIndex: 4, display: "flex", alignItems: "center", gap: 1, bgcolor: "rgba(255,255,255,.94)", backdropFilter: "blur(12px)", py: 1.5, px: 2, borderRadius: 3, boxShadow: "0 8px 30px rgba(23,53,75,.07)" }}>
              <Icon name="shield" sx={{ fontSize: 24, color: "brand.blue" }} /><Box><Typography sx={{ fontSize: 12, fontWeight: 650 }}>99% purity</Typography><Typography sx={{ fontSize: 10.5, color: "text.secondary" }}>Lab tested for purity</Typography></Box>
            </Box>
            {!reduced && <IconButton onClick={() => setPaused(!paused)} aria-label={paused ? "Play hero animations" : "Pause hero animations"} sx={{ position: "absolute", right: 8, bottom: 0, zIndex: 5, width: 36, height: 36, bgcolor: "rgba(255,255,255,.95)", border: "1px solid", borderColor: "divider", "&:hover": { bgcolor: "white" } }}><Box component="span" aria-hidden="true" sx={{ fontSize: 14, fontWeight: 700 }}>{paused ? "▷" : "Ⅱ"}</Box></IconButton>}
          </Box>
        </Box>
      </Box>
    </MotionConfig>
  )
}
