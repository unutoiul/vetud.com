import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Users } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Input, Select, Switch, Table, Tabs, Text, toast, usePrompt } from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"

type Profile = {
  id: string
  customer_id: string
  display_name: string
  handle: string
  role: "member" | "expert" | "moderator"
  credentials: string | null
  reputation: number
  status: "active" | "muted" | "banned"
}
type Post = { id: string; thread_id: string; body: string; is_opening: boolean; status: string; hold_reason: string | null; created_at: string }
type Report = { id: string; reason: string; note: string | null }
type QueueItem = { post: Post; thread: { id: string; title: string; kind: string } | null; author: Profile | null; reports: Report[]; images: { id: string; url: string }[] }
type Thread = {
  id: string
  title: string
  kind: "discussion" | "question"
  status: string
  reply_count: number
  helpful_count: number
  pinned: boolean
  locked: boolean
  last_activity_at: string
  author: Profile | null
}

const STOREFRONT_URL = __STOREFRONT_URL__ || "https://www.vetud.com"
const PAGE_SIZE = 50

const HOLD_LABELS: Record<string, string> = {
  dose: "Contains a dose amount",
  link: "Link from a new member",
  image: "Photos from a new member",
  reports: "Hidden after reports",
}
const KIND_LABELS: Record<string, string> = { question: "Question", discussion: "Discussion" }
const REASON_LABELS: Record<string, string> = { dose: "Dose", medical_claim: "Medical claim", spam: "Spam", abuse: "Abuse", other: "Other" }
const STATUS_COLORS: Record<string, "green" | "orange" | "red" | "grey"> = { published: "green", pending: "orange", hidden: "red", removed: "grey" }

// The dashboard is served by the backend, so the admin session cookie authenticates these calls.
async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
  })
  if (!response.ok) {
    const error = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(error?.message || `Request failed (${response.status})`)
  }
  return response.json() as Promise<T>
}

const threadUrl = (id: string) => `${STOREFRONT_URL}/community/${id}`
const failed = (error: unknown, fallback: string) => toast.error(error instanceof Error ? error.message : fallback)

function Pagination({ count, offset, setOffset }: { count: number; offset: number; setOffset: (update: (value: number) => number) => void }) {
  return <Table.Pagination
    count={count}
    pageSize={PAGE_SIZE}
    pageIndex={Math.floor(offset / PAGE_SIZE)}
    pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))}
    canPreviousPage={offset > 0}
    canNextPage={offset + PAGE_SIZE < count}
    previousPage={() => setOffset(value => Math.max(0, value - PAGE_SIZE))}
    nextPage={() => setOffset(value => value + PAGE_SIZE)}
  />
}

function QueueTab() {
  const prompt = usePrompt()
  const [items, setItems] = useState<QueueItem[]>([])
  const [count, setCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminFetch<{ items: QueueItem[]; count: number }>(`/admin/forum/queue?limit=${PAGE_SIZE}&offset=${offset}`)
      setItems(data.items)
      setCount(data.count)
    } catch (error) {
      failed(error, "Couldn't load the review queue")
    } finally {
      setLoading(false)
    }
  }, [offset])

  useEffect(() => { void load() }, [load])

  const moderate = async (item: QueueItem, action: "approve" | "hide" | "remove") => {
    if (action === "remove") {
      const confirmed = await prompt({
        title: item.post.is_opening ? "Remove this thread?" : "Remove this reply?",
        description: `It disappears from the site and ${item.author?.display_name ?? "the author"} loses 10 reputation points.`,
        confirmText: "Remove",
        cancelText: "Cancel",
      })
      if (!confirmed) return
    }
    try {
      await adminFetch(`/admin/forum/posts/${encodeURIComponent(item.post.id)}/moderate`, { method: "POST", body: JSON.stringify({ action }) })
      toast.success(action === "approve" ? "Published" : action === "hide" ? "Hidden" : "Removed")
      await load()
    } catch (error) {
      failed(error, "Couldn't update the post")
    }
  }

  return <>
    <div className="px-6 py-4">
      <Text size="small" className="text-ui-fg-subtle">
        Posts waiting for a decision, oldest first. Posts with dose amounts and new members&apos; links wait here before they appear. Posts that 3 members report are hidden until you review them. Approving also dismisses the reports.
      </Text>
    </div>
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Why</Table.HeaderCell>
          <Table.HeaderCell>Thread</Table.HeaderCell>
          <Table.HeaderCell>Author</Table.HeaderCell>
          <Table.HeaderCell>Post</Table.HeaderCell>
          <Table.HeaderCell />
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {items.map(item => (
          <Table.Row key={item.post.id} className="align-top">
            <Table.Cell className="py-3">
              <div className="flex flex-col gap-1">
                {item.post.hold_reason ? <Badge size="2xsmall" color="orange">{HOLD_LABELS[item.post.hold_reason] ?? item.post.hold_reason}</Badge> : null}
                {item.reports.length ? <Badge size="2xsmall" color="red">{item.reports.length} report{item.reports.length === 1 ? "" : "s"}</Badge> : null}
                {item.reports.map(report => <Text key={report.id} size="xsmall" className="text-ui-fg-subtle">{REASON_LABELS[report.reason] ?? report.reason}{report.note ? `: ${report.note}` : ""}</Text>)}
              </div>
            </Table.Cell>
            <Table.Cell className="max-w-[220px] py-3">
              {item.thread ? <a className="text-ui-fg-interactive" href={threadUrl(item.thread.id)} target="_blank" rel="noreferrer">{item.thread.title}</a> : "—"}
              <Text size="xsmall" className="text-ui-fg-subtle">{item.post.is_opening ? "Opening post" : "Reply"} · {new Date(item.post.created_at).toLocaleString()}</Text>
            </Table.Cell>
            <Table.Cell className="py-3">
              {item.author ? <a className="text-ui-fg-interactive" href={`/app/customers/${item.author.customer_id}`}>{item.author.display_name}</a> : "Former member"}
              {item.author ? <Text size="xsmall" className="text-ui-fg-subtle">{item.author.reputation} points</Text> : null}
            </Table.Cell>
            <Table.Cell className="max-w-[480px] whitespace-pre-wrap break-words py-3">
              {item.post.body}
              {item.images?.length ? <div className="mt-2 flex flex-wrap gap-2">
                {item.images.map(image => <a key={image.id} href={image.url} target="_blank" rel="noreferrer">
                  <img src={image.url} alt="Member photo" className="h-24 w-24 rounded-md border object-cover" />
                </a>)}
              </div> : null}
            </Table.Cell>
            <Table.Cell className="py-3">
              <div className="flex flex-col gap-2">
                <Button size="small" onClick={() => void moderate(item, "approve")}>Approve</Button>
                <Button size="small" variant="secondary" onClick={() => void moderate(item, "hide")}>Hide</Button>
                <Button size="small" variant="danger" onClick={() => void moderate(item, "remove")}>Remove</Button>
              </div>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
    {!loading && !items.length ? <Text className="px-6 py-4 text-ui-fg-subtle">Nothing to review.</Text> : null}
    <Pagination count={count} offset={offset} setOffset={setOffset} />
  </>
}

function ThreadsTab() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [count, setCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("all")

  const load = useCallback(async () => {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) })
    if (q.trim()) params.set("q", q.trim())
    if (status !== "all") params.set("status", status)
    try {
      const data = await adminFetch<{ threads: Thread[]; count: number }>(`/admin/forum/threads?${params}`)
      setThreads(data.threads)
      setCount(data.count)
    } catch (error) {
      failed(error, "Couldn't load threads")
    }
  }, [offset, q, status])

  useEffect(() => { void load() }, [load])

  const update = async (thread: Thread, changes: Partial<Pick<Thread, "pinned" | "locked">>) => {
    try {
      await adminFetch(`/admin/forum/threads/${encodeURIComponent(thread.id)}`, { method: "POST", body: JSON.stringify(changes) })
      setThreads(current => current.map(entry => entry.id === thread.id ? { ...entry, ...changes } : entry))
    } catch (error) {
      failed(error, "Couldn't update the thread")
    }
  }

  return <>
    <div className="flex flex-wrap gap-3 px-6 py-4">
      <div className="w-[280px]"><Input type="search" placeholder="Search titles" value={q} onChange={event => { setOffset(0); setQ(event.target.value) }} /></div>
      <div className="w-[180px]">
        <Select value={status} onValueChange={value => { setOffset(0); setStatus(value) }}>
          <Select.Trigger><Select.Value /></Select.Trigger>
          <Select.Content>
            {["all", "published", "pending", "hidden", "removed"].map(value => <Select.Item key={value} value={value}>{value === "all" ? "Any status" : value[0].toUpperCase() + value.slice(1)}</Select.Item>)}
          </Select.Content>
        </Select>
      </div>
    </div>
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Thread</Table.HeaderCell>
          <Table.HeaderCell>Status</Table.HeaderCell>
          <Table.HeaderCell>Replies</Table.HeaderCell>
          <Table.HeaderCell>Pinned</Table.HeaderCell>
          <Table.HeaderCell>Locked</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {threads.map(thread => (
          <Table.Row key={thread.id}>
            <Table.Cell className="max-w-[420px] py-3">
              <a className="text-ui-fg-interactive" href={threadUrl(thread.id)} target="_blank" rel="noreferrer">{thread.title}</a>
              <Text size="xsmall" className="text-ui-fg-subtle">{KIND_LABELS[thread.kind]} · {thread.author?.display_name ?? "Former member"} · {new Date(thread.last_activity_at).toLocaleDateString()}</Text>
            </Table.Cell>
            <Table.Cell><Badge size="2xsmall" color={STATUS_COLORS[thread.status] ?? "grey"}>{thread.status}</Badge></Table.Cell>
            <Table.Cell>{thread.reply_count}</Table.Cell>
            <Table.Cell><Switch aria-label="Pinned" checked={thread.pinned} onCheckedChange={checked => void update(thread, { pinned: checked })} /></Table.Cell>
            <Table.Cell><Switch aria-label="Locked" checked={thread.locked} onCheckedChange={checked => void update(thread, { locked: checked })} /></Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
    <Pagination count={count} offset={offset} setOffset={setOffset} />
  </>
}

function MemberRow({ member, onSaved }: { member: Profile; onSaved: (member: Profile) => void }) {
  const [role, setRole] = useState(member.role)
  const [credentials, setCredentials] = useState(member.credentials ?? "")
  const [status, setStatus] = useState(member.status)
  const [saving, setSaving] = useState(false)
  const changed = role !== member.role || credentials !== (member.credentials ?? "") || status !== member.status

  const save = async () => {
    setSaving(true)
    try {
      const { member: updated } = await adminFetch<{ member: Profile }>(`/admin/forum/members/${encodeURIComponent(member.id)}`, {
        method: "POST",
        body: JSON.stringify({ role, credentials: credentials.trim() || null, status }),
      })
      onSaved(updated)
      toast.success(`${member.display_name} updated`)
    } catch (error) {
      failed(error, "Couldn't update the member")
    } finally {
      setSaving(false)
    }
  }

  return <Table.Row className="align-top">
    <Table.Cell className="py-3">
      <a className="text-ui-fg-interactive" href={`/app/customers/${member.customer_id}`}>{member.display_name}</a>
      <Text size="xsmall" className="text-ui-fg-subtle">@{member.handle} · {member.reputation} points</Text>
    </Table.Cell>
    <Table.Cell className="w-[160px] py-3">
      <Select value={role} onValueChange={value => setRole(value as Profile["role"])}>
        <Select.Trigger><Select.Value /></Select.Trigger>
        <Select.Content>
          <Select.Item value="member">Member</Select.Item>
          <Select.Item value="expert">Expert</Select.Item>
          <Select.Item value="moderator">Moderator</Select.Item>
        </Select.Content>
      </Select>
    </Table.Cell>
    <Table.Cell className="w-[260px] py-3">
      <Input placeholder="e.g. MD, endocrinology" value={credentials} onChange={event => setCredentials(event.target.value)} maxLength={80} />
    </Table.Cell>
    <Table.Cell className="w-[150px] py-3">
      <Select value={status} onValueChange={value => setStatus(value as Profile["status"])}>
        <Select.Trigger><Select.Value /></Select.Trigger>
        <Select.Content>
          <Select.Item value="active">Active</Select.Item>
          <Select.Item value="muted">Muted</Select.Item>
          <Select.Item value="banned">Banned</Select.Item>
        </Select.Content>
      </Select>
    </Table.Cell>
    <Table.Cell className="py-3">
      <Button size="small" variant="secondary" disabled={!changed || saving} isLoading={saving} onClick={() => void save()}>Save</Button>
    </Table.Cell>
  </Table.Row>
}

function MembersTab() {
  const [members, setMembers] = useState<Profile[]>([])
  const [count, setCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [q, setQ] = useState("")

  const load = useCallback(async () => {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) })
    if (q.trim()) params.set("q", q.trim())
    try {
      const data = await adminFetch<{ members: Profile[]; count: number }>(`/admin/forum/members?${params}`)
      setMembers(data.members)
      setCount(data.count)
    } catch (error) {
      failed(error, "Couldn't load members")
    }
  }, [offset, q])

  useEffect(() => { void load() }, [load])

  return <>
    <div className="flex flex-wrap items-center gap-3 px-6 py-4">
      <div className="w-[280px]"><Input type="search" placeholder="Search names" value={q} onChange={event => { setOffset(0); setQ(event.target.value) }} /></div>
      <Text size="small" className="text-ui-fg-subtle">Experts get a badge with their credentials, and their answers are pinned. Moderators can choose the best answer on any question. Muted and banned members can read but not post, vote or report.</Text>
    </div>
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Member</Table.HeaderCell>
          <Table.HeaderCell>Role</Table.HeaderCell>
          <Table.HeaderCell>Credentials</Table.HeaderCell>
          <Table.HeaderCell>Status</Table.HeaderCell>
          <Table.HeaderCell />
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {members.map(member => <MemberRow key={`${member.id}-${member.role}-${member.status}-${member.credentials}`} member={member} onSaved={updated => setMembers(current => current.map(entry => entry.id === updated.id ? updated : entry))} />)}
      </Table.Body>
    </Table>
    <Pagination count={count} offset={offset} setOffset={setOffset} />
  </>
}

const CommunityPage = () => (
  <Container className="divide-y p-0">
    <div className="px-6 py-4">
      <Heading level="h2">Community</Heading>
      <Text size="small" className="text-ui-fg-subtle">
        Review held and reported posts, pin or lock threads, and choose experts and moderators for the forum at /community.
      </Text>
    </div>
    <Tabs defaultValue="queue">
      <div className="px-6 py-3">
        <Tabs.List>
          <Tabs.Trigger value="queue">Review queue</Tabs.Trigger>
          <Tabs.Trigger value="threads">Threads</Tabs.Trigger>
          <Tabs.Trigger value="members">Members</Tabs.Trigger>
        </Tabs.List>
      </div>
      <Tabs.Content value="queue"><QueueTab /></Tabs.Content>
      <Tabs.Content value="threads"><ThreadsTab /></Tabs.Content>
      <Tabs.Content value="members"><MembersTab /></Tabs.Content>
    </Tabs>
  </Container>
)

export const config = defineRouteConfig({
  label: "Community",
  icon: Users,
})

export default CommunityPage
