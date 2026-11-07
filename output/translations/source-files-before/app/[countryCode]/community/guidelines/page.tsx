import { useTranslations } from "next-intl"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { AppLink, ButtonLink } from "@/components/common/links"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import { COMMUNITY_DISCLAIMER } from "@/components/community/CommunityDisclaimer"
import { communityMetadata } from "@/lib/community/seo"

export const metadata = communityMetadata({
  path: "/community/guidelines",
  title: "Community guidelines",
  description: "How the Vetud community works: no doses, no medical advice, and how moderation, experts and reputation work.",
})

const RULES: { title: string; points: string[] }[] = [
  {
    title: "1. Never share doses or protocols",
    points: [
      "Don't post amounts, schedules, cycles or \"stacks\" with quantities, and don't ask others for theirs.",
      "Posts that mention a dose amount (for example \"250 mcg\" or \"10 units\") wait for a moderator before they appear.",
      "Don't name or link to other sellers, and don't offer to sell, swap or give away products.",
    ],
  },
  {
    title: "2. Share observations, not medical advice",
    points: [
      "Describe what you noticed and cite your sources. Don't tell others what to take or diagnose anyone.",
      "If someone describes symptoms that worry you, suggest they speak to a doctor.",
      "Vetud supplies laboratory research materials. Nothing in the community is a recommendation to use them in people.",
    ],
  },
  {
    title: "3. Respect other members",
    points: [
      "Be kind and specific. Disagree with ideas, not people.",
      "Don't share anyone's personal details, including your own beyond your community name.",
      "Report posts that break these rules rather than replying to them.",
    ],
  },
]

const HOW = [
  { title: "Moderation", text: "Posts with dose amounts, and links from members below the Contributor level, wait for a moderator. When three members report a post, it's hidden until a moderator reviews it. Moderators can remove posts, close threads, and mute or ban accounts." },
  { title: "Experts", text: "Doctors and researchers are verified by the Vetud team before they get the Expert badge. Their credentials appear next to every answer, and the most helpful expert answer is pinned in each thread." },
  { title: "Verified buyers and lots", text: "Members with a paid Vetud order for a product get a Verified buyer badge on posts about it. Lot numbers are checked against our published lot records; we can't confirm which lot a member received, so the lot is shown as the member reported it." },
  { title: "Reputation", text: "Members earn 2 points for each helpful vote and 15 for a best answer, and lose 10 when a moderator removes a post. Levels: Member, Contributor (25), Trusted member (100) and Community lead (300)." },
  { title: "Your data", text: "Your community name, posts and photos are public. Your email address and real name are never shown. You can edit or delete your posts at any time; see the privacy policy for everything else." },
]

export default function GuidelinesPage() {
  const act = useTranslations("Actions")
  return <>
    <PageHeader eyebrow="Community" title="Community guidelines." description="A professional space for peptide research: cited sources and respectful discussion." />
    <Section tone="white" sx={{ py: { xs: 5, md: 8 } }}>
      <Box sx={{ maxWidth: 820, display: "grid", gap: { xs: 4, md: 5 } }}>
        {RULES.map(rule => <Box component="section" key={rule.title}>
          <Typography component="h2" sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 650, color: "brand.navy" }}>{rule.title}</Typography>
          <Box component="ul" sx={{ m: 0, mt: 1.5, pl: 2.5, display: "grid", gap: 1.25, fontSize: 16, lineHeight: 1.75, color: "brand.ink", "& li::marker": { color: "brand.blue" } }}>
            {rule.points.map(point => <li key={point}>{point}</li>)}
          </Box>
        </Box>)}
        <Box component="section" sx={{ pt: { xs: 3, md: 4 }, borderTop: "1px solid", borderColor: "divider" }}>
          <Typography component="h2" sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 650, color: "brand.navy", mb: 2 }}>How the community works</Typography>
          <Box component="dl" sx={{ m: 0, display: "grid", gap: 2.5, "& dt": { fontWeight: 700, color: "brand.navy" }, "& dd": { m: 0, mt: .5, fontSize: 15.5, lineHeight: 1.75, color: "brand.navySoft" } }}>
            {HOW.map(item => <div key={item.title}><dt>{item.title}</dt><dd>{item.text}</dd></div>)}
          </Box>
        </Box>
        <Typography sx={{ fontSize: 14, lineHeight: 1.7, color: "text.secondary" }}>
          {COMMUNITY_DISCLAIMER} Questions about these guidelines? <AppLink href="/contact">{act("contact")}</AppLink>. Read the <AppLink href="/legal/research-use">{act("researchPolicy")}</AppLink> and <AppLink href="/legal/privacy">{act("privacyPolicy")}</AppLink>.
        </Typography>
        <Box><ButtonLink href="/community" variant="contained">{act("community")}</ButtonLink></Box>
      </Box>
    </Section>
  </>
}
