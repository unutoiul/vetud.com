import { useContentTranslator } from "@/i18n/use-content-translator"
import { useTranslations } from "next-intl"
import Typography from "@mui/material/Typography"
import type { SxProps, Theme } from "@mui/material/styles"
import { AppLink } from "../common/links"

export const COMMUNITY_DISCLAIMER = "Member posts are personal, unverified observations, not medical advice. Members never share doses. Many peptides discussed here are sold for research only and aren’t approved for people. We don’t recommend taking them; the community is here so people who do can share what they noticed, including side effects."

export default function CommunityDisclaimer({ sx }: { sx?: SxProps<Theme> }) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  return <Typography sx={[{ fontSize: 13, lineHeight: 1.7, color: "text.secondary", maxWidth: 820 }, ...(Array.isArray(sx) ? sx : [sx])]}>
    {ct(COMMUNITY_DISCLAIMER)} <AppLink href="/community/guidelines">{act("communityGuidelines")}</AppLink>
  </Typography>
}
