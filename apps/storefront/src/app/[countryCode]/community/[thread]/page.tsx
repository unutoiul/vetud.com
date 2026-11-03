import Box from "@mui/material/Box"
import Skeleton from "@mui/material/Skeleton"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import Section from "@/components/common/Section"
import CommunityDisclaimer from "@/components/community/CommunityDisclaimer"
import ThreadView from "@/components/community/ThreadView"
import { ArticleJsonLd } from "@/components/learn/ReadingLayout"
import { articleUrl } from "@/lib/article-seo"
import { communityMetadata } from "@/lib/community/seo"
import type { ForumAuthor, ForumThreadDetail } from "@/lib/community/types"
import { getForumThread, listForumThreadIds } from "@/lib/medusa/forum"

// Prerendered only so the route's static shell is validated; real threads render on first visit.
const PLACEHOLDER = "__placeholder__"
const THREAD_ID = /^fthr_[A-Za-z0-9]{10,40}$/

export async function generateStaticParams() {
  try {
    const ids = await listForumThreadIds(20)
    return ids.length ? ids.map(thread => ({ thread })) : [{ thread: PLACEHOLDER }]
  } catch {
    // Backend unreachable at build time: threads render on first request instead.
    return [{ thread: PLACEHOLDER }]
  }
}

async function load(id: string) {
  if (!THREAD_ID.test(id)) return null
  try {
    return await getForumThread(id)
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps<"/[countryCode]/community/[thread]">): Promise<Metadata> {
  const { thread: id } = await params
  const detail = await load(id)
  if (!detail) return { title: "Community thread", robots: { index: false, follow: true } }
  return communityMetadata({ title: detail.thread.title, description: detail.thread.excerpt, path: `/community/${id}`, type: "article" })
}

export default function ThreadPage({ params }: PageProps<"/[countryCode]/community/[thread]">) {
  return <Section tone="white" sx={{ py: { xs: 4, md: 6 } }}>
    <Box sx={{ maxWidth: 880, mx: "auto" }}>
      <Suspense fallback={<Box sx={{ display: "grid", gap: 2 }}><Skeleton variant="text" height={64} /><Skeleton variant="rounded" height={320} /></Box>}>
        <ThreadContent params={params} />
      </Suspense>
      <CommunityDisclaimer sx={{ mt: 6, pt: 3, borderTop: "1px solid", borderColor: "divider" }} />
    </Box>
  </Section>
}

async function ThreadContent({ params }: Pick<PageProps<"/[countryCode]/community/[thread]">, "params">) {
  const { thread: id } = await params
  if (id !== PLACEHOLDER && !THREAD_ID.test(id)) notFound()
  const detail = await load(id)
  return <>
    {detail ? <ArticleJsonLd data={structuredData(detail)} /> : null}
    {/* Unknown threads, and threads waiting for review (visible to their author), resolve in the browser. */}
    <ThreadView key={id} threadId={id} initial={detail} />
  </>
}

function person(author: ForumAuthor) {
  return { "@type": "Person", name: author.display_name, ...(author.handle ? { url: articleUrl(`/community/members/${author.handle}`) } : {}) }
}

/** Google's discussion forum markup: the opening post, its replies and their counts. */
function structuredData({ thread, opening, posts }: ForumThreadDetail) {
  const url = articleUrl(`/community/${thread.id}`)
  return {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "@id": url,
    url,
    mainEntityOfPage: url,
    headline: thread.title,
    text: opening.body,
    datePublished: thread.created_at,
    ...(opening.edited_at ? { dateModified: opening.edited_at } : {}),
    author: person(thread.author),
    interactionStatistic: [
      { "@type": "InteractionCounter", interactionType: "https://schema.org/CommentAction", userInteractionCount: thread.reply_count },
      { "@type": "InteractionCounter", interactionType: "https://schema.org/LikeAction", userInteractionCount: opening.helpful_count },
    ],
    comment: posts.slice(0, 25).map(post => ({
      "@type": "Comment",
      text: post.body,
      datePublished: post.created_at,
      author: person(post.author),
      interactionStatistic: { "@type": "InteractionCounter", interactionType: "https://schema.org/LikeAction", userInteractionCount: post.helpful_count },
    })),
  }
}
