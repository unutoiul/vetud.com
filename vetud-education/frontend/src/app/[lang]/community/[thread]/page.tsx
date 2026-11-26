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
import { threadHref, threadIdFromSegment } from "@/lib/community/format"
import { communityMetadata } from "@/lib/community/seo"
import type { ForumAuthor, ForumThreadDetail } from "@/lib/community/types"
import { getForumThread, listForumThreadLinks } from "@/lib/medusa/forum"
import { getPageLocalization } from "@/i18n/metadata"

// Prerendered only so the route's static shell is validated; real threads render on first visit.
const PLACEHOLDER = "__placeholder__"

export async function generateStaticParams() {
  try {
    const threads = await listForumThreadLinks(20)
    return threads.length ? threads.map(thread => ({ thread: threadHref(thread).replace("/community/", "") })) : [{ thread: PLACEHOLDER }]
  } catch {
    // Backend unreachable at build time: threads render on first request instead.
    return [{ thread: PLACEHOLDER }]
  }
}

async function load(segment: string) {
  const id = threadIdFromSegment(segment)
  if (!id) return null
  try {
    return await getForumThread(id)
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps<"/[lang]/community/[thread]">): Promise<Metadata> {
  const { thread: segment } = await params
  const detail = await load(segment)
  if (!detail) return { title: "Community thread", robots: { index: false, follow: true } }
  // Old bare-id addresses and renamed threads point search engines at the current readable address.
  return communityMetadata({ title: detail.thread.title, description: detail.thread.excerpt, path: threadHref(detail.thread), type: "article", memberContent: true })
}

export default function ThreadPage({ params }: PageProps<"/[lang]/community/[thread]">) {
  return <Section tone="white" sx={{ py: { xs: 4, md: 6 } }}>
    <Box sx={{ maxWidth: 880, mx: "auto" }}>
      <Suspense fallback={<Box sx={{ display: "grid", gap: 2 }}><Skeleton variant="text" height={64} /><Skeleton variant="rounded" height={320} /></Box>}>
        <ThreadContent params={params} />
      </Suspense>
      <CommunityDisclaimer sx={{ mt: 6, pt: 3, borderTop: "1px solid", borderColor: "divider" }} />
    </Box>
  </Section>
}

async function ThreadContent({ params }: Pick<PageProps<"/[lang]/community/[thread]">, "params">) {
  const { thread: segment } = await params
  const id = threadIdFromSegment(segment)
  if (segment !== PLACEHOLDER && !id) notFound()
  const detail = await load(segment)
  return <>
    {detail ? <ArticleJsonLd data={await structuredData(detail)} /> : null}
    {/* Unknown threads, and threads waiting for review (visible to their author), resolve in the browser. */}
    <ThreadView key={id ?? segment} threadId={id ?? segment} initial={detail} />
  </>
}

function person(author: ForumAuthor, language: string) {
  return { "@type": "Person", name: author.display_name, ...(author.handle ? { url: articleUrl(`/community/members/${author.handle}`, language) } : {}) }
}

/** Google's discussion forum markup: the opening post, its replies and their counts. */
async function structuredData({ thread, opening, posts }: ForumThreadDetail) {
  const { language } = await getPageLocalization()
  const url = articleUrl(threadHref(thread), language)
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
    author: person(thread.author, language),
    interactionStatistic: [
      { "@type": "InteractionCounter", interactionType: "https://schema.org/CommentAction", userInteractionCount: thread.reply_count },
      { "@type": "InteractionCounter", interactionType: "https://schema.org/LikeAction", userInteractionCount: opening.helpful_count },
    ],
    comment: posts.slice(0, 25).map(post => ({
      "@type": "Comment",
      text: post.body,
      datePublished: post.created_at,
      author: person(post.author, language),
      interactionStatistic: { "@type": "InteractionCounter", interactionType: "https://schema.org/LikeAction", userInteractionCount: post.helpful_count },
    })),
  }
}
