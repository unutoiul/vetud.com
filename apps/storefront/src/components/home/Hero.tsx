import NorthEastIcon from "@mui/icons-material/NorthEast"
import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { gutter } from "@/theme/tokens"
import { ButtonLink } from "../common/links"
import { SerifAccent } from "../common/SectionHeading"
import ProductArt from "../product/ProductArt"

const orbit = (size: number, rotate: number, scaleY: number, opacity: number, duration: number) => ({
  position: "absolute" as const,
  width: size,
  height: size,
  animation: `vetud-spin ${duration}s linear infinite`,
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    border: `1px solid rgba(137,208,202,${opacity})`,
    borderRadius: "50%",
    transform: `rotate(${rotate}deg) scaleY(${scaleY})`,
  },
})

const molecule = (size: number, position: object, delay: number) => ({
  position: "absolute" as const,
  width: size,
  height: size,
  borderRadius: "50%",
  border: "1px solid #75d6cf",
  bgcolor: "rgba(8,43,59,.45)",
  boxShadow: "0 0 22px rgba(60,199,194,.24)",
  display: "grid",
  placeItems: "center",
  animation: `vetud-float 7s ease-in-out ${delay}s infinite`,
  "&::before": {
    content: '""',
    width: "37%",
    height: "37%",
    border: "1px solid #72d8cc",
    borderRadius: "50%",
    boxShadow: "18px 6px 0 -7px #3ac2bb, -12px 15px 0 -8px #a2e8d5",
  },
  ...position,
})

const STATS = [
  { value: "≥ 99%", label: "HPLC purity target" },
  { value: "Per lot", label: "Documented batches" },
  { value: "US · EU", label: "Shipping regions" },
]

export default function Hero() {
  return (
    <Box
      component="section"
      aria-labelledby="hero-title"
      sx={{
        position: "relative",
        overflow: "hidden",
        bgcolor: "brand.navy",
        color: "brand.onNavy",
        px: gutter,
        pt: { xs: 8, md: 10 },
        pb: { xs: 10, md: 12 },
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at 76% 49%, rgba(28,128,144,.35), transparent 42%), linear-gradient(115deg, transparent 45%, rgba(30,92,112,.2))",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.35,
          backgroundImage:
            "linear-gradient(rgba(137,208,202,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(137,208,202,.07) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "linear-gradient(90deg, transparent, #000 60%)",
        },
      }}
    >
      <Grid container spacing={{ xs: 6, md: 4 }} sx={{ maxWidth: 1240, mx: "auto", position: "relative", zIndex: 1, alignItems: "center" }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 3 }}>
            <Box sx={{ width: 28, height: "1px", bgcolor: "brand.tealBright" }} />
            <Typography variant="eyebrow" sx={{ color: "#7ad7ce" }}>
              Research-grade materials · Lot-documented
            </Typography>
          </Stack>
          <Typography id="hero-title" variant="h1" sx={{ mb: 3.5 }}>
            Precision
            <br />
            begins at the
            <br />
            <SerifAccent color="#7bd4ca">sequence.</SerifAccent>
          </Typography>
          <Typography variant="lead" sx={{ color: "#bbd0d4", maxWidth: 470, mb: 4 }}>
            A considered collection for modern research. Vetud brings material clarity, traceable
            documentation and a quieter kind of confidence to the lab.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
            <ButtonLink href="/shop" variant="contained" color="mint" size="large" endIcon={<NorthEastIcon />}>
              Explore the collection
            </ButtonLink>
            <ButtonLink
              href="/standards"
              variant="outlined"
              size="large"
              sx={{ color: "#d9f4eb", borderColor: "rgba(217,244,235,.35)", "&:hover": { borderColor: "#d9f4eb" } }}
            >
              Our standards
            </ButtonLink>
          </Stack>
          <Stack direction="row" spacing={{ xs: 3, sm: 5 }} sx={{ mt: 6 }}>
            {STATS.map((stat) => (
              <Box key={stat.label}>
                <Typography sx={{ fontSize: { xs: 18, sm: 22 }, fontWeight: 600, letterSpacing: "-0.02em" }}>
                  {stat.value}
                </Typography>
                <Typography variant="eyebrow" sx={{ mt: 0.5, color: "#8fb1b5", fontSize: 10.5 }}>
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Box
            aria-hidden
            sx={{ position: "relative", height: { xs: 320, sm: 420, md: 460 }, display: "grid", placeItems: "center" }}
          >
            <Box sx={orbit(420, -25, 0.54, 0.2, 90)} />
            <Box sx={orbit(500, 57, 0.48, 0.14, 120)} />
            <Box sx={orbit(360, 20, 0.72, 0.25, 70)} />
            <Box sx={molecule(76, { top: "12%", right: "6%" }, 0)} />
            <Box sx={molecule(56, { bottom: "12%", left: "6%" }, 1.5)} />
            <Box sx={molecule(38, { top: "17%", left: "12%" }, 3)} />
            <Box
              sx={{
                width: { xs: "82%", sm: 380 },
                position: "relative",
                zIndex: 1,
                transform: "rotate(-7deg)",
                filter: "drop-shadow(0 24px 40px rgba(0,0,0,.35)) drop-shadow(0 0 40px rgba(62,197,190,.18))",
              }}
            >
              <ProductArt code="VTD-01 · SEQ SERIES" accent="#3cc7c2" />
            </Box>
            <Box sx={{ position: "absolute", right: 0, bottom: 4, textAlign: "right", display: { xs: "none", sm: "block" } }}>
              <Typography variant="eyebrow" sx={{ color: "#8fb1b5", fontSize: 10.5 }}>
                VTD / Sequence architecture
              </Typography>
              <Typography sx={{ color: "#d4f0e6", fontSize: 13, fontWeight: 500 }}>01 · Molecular clarity</Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}
