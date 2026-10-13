import Box from "@mui/material/Box"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import Icon from "../brand/Icon"
import { ButtonLink } from "../common/links"
import { gutter, motion } from "@/theme/tokens"

const DETAILS = [
  { icon: "flask" as const, title: "Research first", text: "Purposefully selected" },
  { icon: "document" as const, title: "Fully traceable", text: "Records by lot" },
  { icon: "shield" as const, title: "Clearly specified", text: "Details you can verify" },
]

export default function Hero() {
  return (
    <Box component="section" aria-labelledby="hero-title" sx={{ px: gutter, pt: { xs: 4, md: 5 }, pb: { xs: 5, md: 7 } }}>
      <Box sx={{ maxWidth: 1360, mx: "auto", display: "grid", gridTemplateColumns: { xs: "1fr", md: "0.88fr 1.12fr" }, gap: { xs: 4, md: 5, lg: 7 }, alignItems: "center" }}>
        <Box sx={{ py: { xs: 1, md: 4 }, animation: `vetud-enter .9s ${motion} both` }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: { xs: 3, md: 4 } }}>
            <Icon name="molecule" sx={{ color: "brand.blue", fontSize: 19 }} />
            <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "brand.navySoft" }}>A considered approach to peptide science</Typography>
          </Stack>
          <Typography id="hero-title" variant="h1" sx={{ maxWidth: 600, mb: 3.5 }}>
            Pure science.<br />Clear perspective.
          </Typography>
          <Typography variant="lead" sx={{ maxWidth: 410, color: "text.secondary", mb: 4 }}>
            Research materials, thoughtfully considered. Explore a focused collection with clear specifications and a traceable story behind every lot.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ alignItems: { xs: "stretch", sm: "center" } }}>
            <ButtonLink href="/shop" variant="contained" size="large" endIcon={<Icon name="arrowUpRight" />}>Explore the collection</ButtonLink>
            <ButtonLink href="/standards" variant="text" size="large" sx={{ color: "brand.navySoft" }}>Our standards</ButtonLink>
          </Stack>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mt: { xs: 3, md: 5 }, color: "text.secondary" }}>
            <Icon name="flask" sx={{ fontSize: 17 }} />
            <Typography sx={{ fontSize: 11.5 }}>For laboratory research use only</Typography>
          </Stack>
        </Box>
        <Box sx={{ p: .75, borderRadius: { xs: 4, md: 5 }, bgcolor: "#e6eef2", boxShadow: "0 24px 70px rgba(40,83,104,.07)", animation: `vetud-enter 1.1s ${motion} .1s both` }}>
          <Box sx={{ position: "relative", borderRadius: { xs: 3.25, md: 4.25 }, overflow: "hidden", height: { xs: 360, sm: 460, md: 550, lg: 590 }, bgcolor: "#deebf3", "& > img": { objectPosition: { xs: "80% center", sm: "65% center", md: "60% center" } } }}>
            <Image src="/images/vetud-alpine-hero.png" alt="VETUD's white and silver peptide research collection beside a clear alpine lake" fill priority sizes="(max-width: 900px) 100vw, 58vw" style={{ objectFit: "cover" }} />
            <Box sx={{ position: "absolute", inset: "auto 16px 16px", bgcolor: "rgba(255,255,255,.96)", borderRadius: 3, py: 2.25, px: { xs: 1.5, md: 2.5 }, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1 }}>
              {DETAILS.map((detail) => <Box key={detail.title} sx={{ textAlign: "center", minWidth: 0 }}>
                <Icon name={detail.icon} sx={{ fontSize: 25, color: "brand.navySoft", mb: .65 }} />
                <Typography sx={{ fontSize: { xs: 10.5, sm: 12 }, fontWeight: 650 }}>{detail.title}</Typography>
                <Typography sx={{ fontSize: 10.5, color: "text.secondary", mt: .25, display: { xs: "none", sm: "block" } }}>{detail.text}</Typography>
              </Box>)}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
