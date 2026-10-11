import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined"
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined"
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined"
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined"
import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { gutter } from "@/theme/tokens"

const ITEMS = [
  { icon: DescriptionOutlinedIcon, title: "Lot-level documentation", text: "Clear records, easy to find" },
  { icon: VerifiedOutlinedIcon, title: "Quality-minded sourcing", text: "Standards made visible" },
  { icon: ScienceOutlinedIcon, title: "Research-first catalog", text: "Designed for professionals" },
  { icon: SupportAgentOutlinedIcon, title: "Responsive support", text: "People behind the science" },
]

export default function TrustBar() {
  return (
    <Box sx={{ bgcolor: "#eff4f1", borderBottom: "1px solid #e0e9e6", px: gutter, py: { xs: 2.5, md: 3 } }}>
      <Grid container spacing={{ xs: 2, md: 0 }} sx={{ maxWidth: 1240, mx: "auto" }} component="ul" role="list" style={{ listStyle: "none", padding: 0, margin: "0 auto" }}>
        {ITEMS.map(({ icon: Icon, title, text }, index) => (
          <Grid
            key={title}
            size={{ xs: 6, md: 3 }}
            component="li"
            sx={{
              borderRight: { md: index < ITEMS.length - 1 ? "1px solid #d7e3df" : "none" },
              px: { md: 2.5 },
              "&:first-of-type": { pl: { md: 0 } },
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  flexShrink: 0,
                  border: "1px solid #9bbeb7",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  color: "#2f7f7b",
                }}
              >
                <Icon sx={{ fontSize: 19 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#153a4b", lineHeight: 1.35 }}>{title}</Typography>
                <Typography sx={{ fontSize: 13, color: "#3c5b62", lineHeight: 1.4 }}>{text}</Typography>
              </Box>
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
