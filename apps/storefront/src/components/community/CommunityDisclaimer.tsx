import Typography from "@mui/material/Typography"
import type { SxProps, Theme } from "@mui/material/styles"
import { AppLink } from "../common/links"

export const COMMUNITY_DISCLAIMER = "Member posts are personal, unverified observations, not medical advice. Members never share doses. Vetud supplies laboratory research materials and doesn't advise on personal use."

export default function CommunityDisclaimer({ sx }: { sx?: SxProps<Theme> }) {
  return <Typography sx={[{ fontSize: 13, lineHeight: 1.7, color: "text.secondary", maxWidth: 820 }, ...(Array.isArray(sx) ? sx : [sx])]}>
    {COMMUNITY_DISCLAIMER} <AppLink href="/community/guidelines">Community guidelines</AppLink>
  </Typography>
}
