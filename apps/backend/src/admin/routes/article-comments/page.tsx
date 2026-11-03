import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight } from "@medusajs/icons"
import { Button, Container, Heading, Table, Text, toast, usePrompt } from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"

type AdminArticleComment = {
  id: string
  article_slug: string
  customer_id: string
  author_name: string
  body: string
  created_at: string
}

const PAGE_SIZE = 50
const STOREFRONT_URL = "https://www.vetud.com"

// The dashboard is served by the backend, so the admin session cookie authenticates these calls.
async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: "include", ...init })
  if (!response.ok) throw new Error(`Request failed (${response.status})`)
  return response.json() as Promise<T>
}

const ArticleCommentsPage = () => {
  const prompt = usePrompt()
  const [offset, setOffset] = useState(0)
  const [comments, setComments] = useState<AdminArticleComment[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminFetch<{ comments: AdminArticleComment[]; count: number }>(`/admin/article-comments?limit=${PAGE_SIZE}&offset=${offset}`)
      setComments(data.comments)
      setCount(data.count)
    } catch {
      toast.error("Couldn't load comments")
    } finally {
      setLoading(false)
    }
  }, [offset])

  useEffect(() => { void load() }, [load])

  const remove = async (comment: AdminArticleComment) => {
    const confirmed = await prompt({
      title: "Delete comment?",
      description: `${comment.author_name}'s comment will be removed from /news/${comment.article_slug}.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    })
    if (!confirmed) return
    try {
      await adminFetch(`/admin/article-comments/${encodeURIComponent(comment.id)}`, { method: "DELETE" })
      toast.success("Comment deleted")
      await load()
    } catch {
      toast.error("Couldn't delete the comment")
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Article comments</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Comments from signed-in customers on news articles, newest first. They appear on the site as soon as they are posted; delete any that break the rules (for example, doses or medical advice).
        </Text>
      </div>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Posted</Table.HeaderCell>
            <Table.HeaderCell>Article</Table.HeaderCell>
            <Table.HeaderCell>Author</Table.HeaderCell>
            <Table.HeaderCell>Comment</Table.HeaderCell>
            <Table.HeaderCell />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {comments.map(comment => (
            <Table.Row key={comment.id} className="align-top">
              <Table.Cell className="whitespace-nowrap">{new Date(comment.created_at).toLocaleString()}</Table.Cell>
              <Table.Cell>
                <a className="text-ui-fg-interactive" href={`${STOREFRONT_URL}/news/${comment.article_slug}#comments`} target="_blank" rel="noreferrer">{comment.article_slug}</a>
              </Table.Cell>
              <Table.Cell>
                <a className="text-ui-fg-interactive" href={`/app/customers/${comment.customer_id}`}>{comment.author_name}</a>
              </Table.Cell>
              <Table.Cell className="max-w-[480px] whitespace-pre-wrap break-words py-3">{comment.body}</Table.Cell>
              <Table.Cell>
                <Button size="small" variant="danger" onClick={() => void remove(comment)}>Delete</Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      {!loading && !comments.length ? <Text className="px-6 py-4 text-ui-fg-subtle">No comments yet.</Text> : null}
      <Table.Pagination
        count={count}
        pageSize={PAGE_SIZE}
        pageIndex={Math.floor(offset / PAGE_SIZE)}
        pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))}
        canPreviousPage={offset > 0}
        canNextPage={offset + PAGE_SIZE < count}
        previousPage={() => setOffset(value => Math.max(0, value - PAGE_SIZE))}
        nextPage={() => setOffset(value => value + PAGE_SIZE)}
      />
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Article comments",
  icon: ChatBubbleLeftRight,
})

export default ArticleCommentsPage
