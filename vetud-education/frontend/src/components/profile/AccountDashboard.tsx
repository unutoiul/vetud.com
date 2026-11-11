"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Paper from "@mui/material/Paper"
import Skeleton from "@mui/material/Skeleton"
import Stack from "@mui/material/Stack"
import Tab from "@mui/material/Tab"
import Tabs from "@mui/material/Tabs"
import Typography from "@mui/material/Typography"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { formatForumDate } from "@/lib/community/format"
import Icon from "../brand/Icon"
import { ButtonLink } from "../common/links"
import { useAccount } from "../account/AccountProvider"
import { Pill } from "../community/Badges"
import JoinCommunity from "../community/JoinCommunity"
import { CommunityProfileForm, EmailForm, PasswordForm, PersonalDetailsForm } from "./AccountSettings"
import { Achievements, RecentDiscussions, ReputationCard, StatsGrid } from "./ProfileOverview"
import { currentLevel, LEVEL_COLORS } from "./reputation"
import { useOwnProfile } from "./useOwnProfile"

const TABS = [
  { id: "overview", label: "Overview", icon: "molecule" },
  { id: "profile", label: "Profile", icon: "account" },
  { id: "security", label: "Sign-in and security", icon: "lock" },
] as const
type TabId = (typeof TABS)[number]["id"]

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?"

/**
 * The signed-in member's home: who they are in the community, their reputation and level, what
 * they have posted and earned, and the settings for their profile, name, email and password.
 */
export default function AccountDashboard() {
  const ct = useContentTranslator()
  const t = useTranslations("Account")
  const { customer, signOut, pending, error } = useAccount()
  const own = useOwnProfile()
  const [tab, setTab] = useState<TabId>("overview")
  if (!customer) return null

  const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(" ")
  const profile = own.profile
  const level = profile ? currentLevel(own.rules, profile.reputation) : null
  const ring = level ? LEVEL_COLORS[level.id] : "#cbd6e6"

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, background: "linear-gradient(135deg, #f3f7fc 0%, #ffffff 60%)" }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: { xs: 2, sm: 3 }, alignItems: { sm: "center" } }}>
          <Box aria-hidden sx={{ display: "grid", placeItems: "center", width: 84, height: 84, flexShrink: 0, borderRadius: "50%", border: "4px solid", borderColor: ring, bgcolor: "brand.navy", color: "#fff", fontSize: 30, fontWeight: 600, letterSpacing: "-.02em" }}>
            {initials(profile?.display_name ?? fullName)}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {own.loading ? <Skeleton width={240} height={40} /> : (
              <Typography component="h2" sx={{ fontSize: { xs: 26, md: 32 }, fontWeight: 500, letterSpacing: "-.03em", lineHeight: 1.15, overflowWrap: "anywhere" }}>{profile?.display_name ?? fullName}</Typography>
            )}
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mt: 1 }}>
              {profile?.handle ? <Typography component="span" sx={{ fontSize: 14, color: "text.secondary" }}>@{profile.handle}</Typography> : null}
              {level ? <Box component="span" sx={{ px: 1, py: .25, borderRadius: 999, fontSize: 12, fontWeight: 700, color: ring, bgcolor: `${ring}1a` }}>{ct(level.name)}</Box> : null}
              {profile?.role === "expert" ? <Pill tone="expert" icon="flask">{ct("Expert")}{profile.credentials ? ` · ${profile.credentials}` : ""}</Pill> : null}
              {profile?.role === "moderator" ? <Pill tone="moderator" icon="shield">{ct("Moderator")}</Pill> : null}
              {profile ? <Typography component="span" sx={{ fontSize: 13, color: "text.secondary" }}>· {ct.template("Member since {v0}", { v0: formatForumDate(profile.joined_at, ct.locale) }, { translateValues: false })}</Typography> : null}
            </Box>
            {profile?.bio ? <Typography sx={{ mt: 1.5, fontSize: 15, lineHeight: 1.7, color: "text.secondary", maxWidth: 680 }}>{profile.bio}</Typography> : null}
            <Typography sx={{ mt: profile?.bio ? 1 : 1.5, fontSize: 13, color: "text.secondary", overflowWrap: "anywhere" }}>
              {fullName ? `${fullName} · ` : ""}{customer.email} <Box component="span" sx={{ color: "text.disabled" }}>{ct("(private)")}</Box>
            </Typography>
          </Box>
          <Stack direction={{ xs: "row", sm: "column", md: "row" }} spacing={1} sx={{ flexWrap: "wrap", alignSelf: { sm: "center" } }}>
            {profile?.handle ? <ButtonLink href={`/community/members/${profile.handle}`} variant="outlined" startIcon={<Icon name="eye" sx={{ fontSize: 17 }} />}>{ct("Public profile")}</ButtonLink> : null}
            <Button variant="text" disabled={pending} onClick={() => void signOut().catch(() => undefined)}>{t("signout")}</Button>
          </Stack>
        </Box>
        {profile?.status === "muted" ? <Alert severity="warning" sx={{ mt: 2 }}>{ct("A moderator has paused your posting for now. You can still read and vote.")}</Alert> : null}
        {error ? <Alert severity="error" sx={{ mt: 2 }}>{ct(error)}</Alert> : null}
      </Paper>

      <Tabs value={tab} onChange={(_, value: TabId) => setTab(value)} aria-label={ct("Account sections")} variant="scrollable" allowScrollButtonsMobile sx={{ borderBottom: "1px solid", borderColor: "divider", "& .MuiTab-root": { textTransform: "none", fontWeight: 650, minHeight: 52 } }}>
        {TABS.map((item) => <Tab key={item.id} value={item.id} id={`account-tab-${item.id}`} aria-controls={`account-panel-${item.id}`} icon={<Icon name={item.icon} sx={{ fontSize: 18 }} />} iconPosition="start" label={ct(item.label)} />)}
      </Tabs>

      <Box role="tabpanel" id={`account-panel-${tab}`} aria-labelledby={`account-tab-${tab}`}>
        {tab === "overview" ? (
          own.loading ? <Stack spacing={2}><Skeleton variant="rounded" height={260} /><Skeleton variant="rounded" height={120} /></Stack>
            : own.failed ? <Alert severity="error">{ct("We couldn't load your community profile. Please refresh the page.")}</Alert>
            : profile ? (
              <Stack spacing={3}>
                <ReputationCard profile={profile} rules={own.rules} stats={own.stats} />
                <StatsGrid stats={own.stats} />
                <Achievements profile={profile} stats={own.stats} />
                <RecentDiscussions threads={own.threads} />
              </Stack>
            ) : (
              <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, maxWidth: 720 }}>
                <Typography component="h3" sx={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.02em" }}>{ct("Join the community to start your profile.")}</Typography>
                <Typography sx={{ mt: 1, mb: 3, color: "text.secondary" }}>{ct("Choose a public community name. Your posts, helpful votes and best answers build your reputation, unlock levels and earn achievements.")}</Typography>
                <JoinCommunity suggested={own.suggested} onJoined={() => void own.reload()} />
              </Paper>
            )
        ) : null}

        {tab === "profile" ? (
          <Stack spacing={3} sx={{ maxWidth: 760 }}>
            {profile ? <CommunityProfileForm profile={profile} onSaved={(saved) => { own.setProfile(saved); void own.reload() }} />
              : !own.loading ? <Alert severity="info" action={<Button onClick={() => setTab("overview")}>{ct("Join")}</Button>}>{ct("Join the community first to choose your community name.")}</Alert> : null}
            <PersonalDetailsForm key={`${customer.first_name}-${customer.last_name}`} />
          </Stack>
        ) : null}

        {tab === "security" ? (
          <Stack spacing={3} sx={{ maxWidth: 760 }}>
            <EmailForm />
            <PasswordForm />
          </Stack>
        ) : null}
      </Box>
    </Stack>
  )
}
