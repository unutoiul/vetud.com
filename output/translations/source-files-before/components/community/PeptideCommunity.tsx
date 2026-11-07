import { getTranslations } from "next-intl/server"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { AppLink, ButtonLink } from "../common/links"
import ThreadCard from "./ThreadCard"
import type { PeptideProfile } from "@/content/learn/peptides"
import { listForumThreads } from "@/lib/medusa/forum"

/**
 * The community section of a peptide profile: the latest threads about it, or a prompt to ask the
 * first question. Renders the prompt if the community is unreachable.
 */
export default async function PeptideCommunity({ peptide }: { peptide: PeptideProfile }) {
  const act = await getTranslations("Actions")
  const threads = await listForumThreads({ peptides: [peptide.slug], limit: 3 }).catch(() => null)

  if (!threads?.threads.length) {
    return <Box sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "brand.mintWash", borderRadius: "10px" }}>
      <Typography sx={{ fontSize: 16, lineHeight: 1.75, color: "brand.navySoft" }}>
        No community threads about {peptide.name} yet. Ask a question or start a discussion, and verified experts and other members can answer.
      </Typography>
      <ButtonLink href={`/community/new?kind=question&peptide=${peptide.slug}`} variant="contained" sx={{ mt: 2 }}>{act("askAbout")} {peptide.name}</ButtonLink>
    </Box>
  }
  return <Box>
    {threads.threads.map(thread => <ThreadCard key={thread.id} thread={thread} />)}
    <AppLink href={`/community?peptide=${peptide.slug}`} sx={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 15 }}>
      {threads.count > threads.threads.length ? act("threadsAbout", { count: threads.count, peptide: peptide.name }) : act("discussPeptide", { peptide: peptide.name })}
    </AppLink>
  </Box>
}
