// Translates the site's menus (src/i18n/messages) and page text (src/i18n/content) with Claude.
//
//   npm run translate                      every prepared language, only what is missing
//   npm run translate -- --lang es,de      some languages
//   npm run translate -- --only messages   menus only (or --only content)
//   npm run translate -- --dry-run         counts and a cost estimate, no API calls
//   npm run translate -- --direct          no batch: faster for a few strings, twice the price
//   npm run translate -- --no-review       skip the second, checking pass
//
// Needs an Anthropic API key (console.anthropic.com > API keys). Put ANTHROPIC_API_KEY=... in
// .env.translate next to package.json (git ignores every .env file), or set it in your own shell.
// Batches cost half and usually finish within an hour; a run can be stopped and started again, and
// it picks up the batches it already sent.
import Anthropic from "@anthropic-ai/sdk"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { collectInventory, contentLanguages as preparedLanguages, ROOT } from "./content-inventory.mjs"
import { checkContent, checkMessage, keptInEnglish } from "./translation-checks.mjs"

// ---- This site ---------------------------------------------------------------------------------

const SITE = `VETUD (pep.company), an online store for peptides and related laboratory materials, supplied \
for research use only. Product pages and the research library explain what published studies found, in \
plain language. The shop never gives doses, protocols or medical advice. Amounts in product and variant \
names ("Vial · 5 mg") are pack sizes and stay exactly as written. Legal pages (terms, privacy, refunds) \
must keep their exact legal meaning.`
const SOURCE_LANGUAGE = "en"
/** The English menu text file in src/i18n/messages. */
const SOURCE_MESSAGES = "en-US"
/** Each shop language. The menus in src/i18n/messages are already translated, so page text follows their form of address. */
const SAME_ADDRESS = "the same form of address as the existing menu text below"
const LANGUAGE_STYLE = Object.fromEntries(
  Object.entries({
    bg: "Bulgarian",
    cs: "Czech",
    da: "Danish",
    de: "German",
    el: "Greek",
    es: "Spanish (Spain)",
    et: "Estonian",
    fi: "Finnish",
    fr: "French",
    hr: "Croatian",
    hu: "Hungarian",
    is: "Icelandic",
    it: "Italian",
    lt: "Lithuanian",
    lv: "Latvian",
    nb: "Norwegian Bokmål",
    nl: "Dutch",
    pl: "Polish",
    pt: "European Portuguese",
    ro: "Romanian",
    sk: "Slovak",
    sl: "Slovenian",
    sv: "Swedish",
  }).map(([code, name]) => [code, { name, address: SAME_ADDRESS }]),
)

// ---- Settings ----------------------------------------------------------------------------------

const MODEL = "claude-opus-5-5"
const FALLBACK_BETA = "server-side-fallback-2026-07-01"
const GROUP_CHARACTERS = 9000
const GROUP_ITEMS = 100
/** Opus 5.5 per million tokens; batches cost half. */
const PRICE = { input: 4, output: 20 }

const MESSAGES = join(ROOT, "src", "i18n", "messages")
const CONTENT = join(ROOT, "src", "i18n", "content")
const CACHE = join(ROOT, "node_modules", ".cache", "vetud-translate")
const GLOSSARY = JSON.parse(readFileSync(join(ROOT, "scripts", "translation-glossary.json"), "utf8"))

const args = process.argv.slice(2)
const flag = (name) => args.includes(`--${name}`)
const option = (name) => {
  const index = args.indexOf(`--${name}`)
  return index >= 0 ? args[index + 1] : undefined
}
const DRY_RUN = flag("dry-run")
if (!DRY_RUN && !process.env.ANTHROPIC_API_KEY) {
  console.error(`No Anthropic API key found.

  1. Create a key at https://console.anthropic.com/settings/keys (add credit under Billing first).
  2. Create the file ${join(ROOT, ".env.translate")} with one line:
       ANTHROPIC_API_KEY=sk-ant-...
     Git ignores it, so the key stays on this computer.
  3. Run npm run translate again.

(npm run translate -- --dry-run works without a key.)`)
  process.exit(1)
}
const DIRECT = flag("direct")
const REVIEW = !flag("no-review")
const ONLY = option("only")
const languages = (option("lang")?.split(",") ?? preparedLanguages()).filter((language) => language !== SOURCE_LANGUAGE)
for (const language of languages)
  if (!LANGUAGE_STYLE[language]) throw new Error(`Add "${language}" to LANGUAGE_STYLE in scripts/translate.mjs first.`)

// ---- Reading and writing the files ------------------------------------------------------------

const readJson = (path, fallback) => (existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : fallback)
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
const flatten = (value, prefix = "") =>
  Object.entries(value).flatMap(([key, item]) =>
    item && typeof item === "object" ? flatten(item, `${prefix}${key}.`) : [[`${prefix}${key}`, item]],
  )
/** The English file's shape and order, filled from `values`; keys the English no longer has are dropped. */
function rebuild(english, values, prefix = "") {
  const result = {}
  for (const [key, item] of Object.entries(english)) {
    if (item && typeof item === "object") {
      const nested = rebuild(item, values, `${prefix}${key}.`)
      if (Object.keys(nested).length) result[key] = nested
    } else if (typeof values[`${prefix}${key}`] === "string") result[key] = values[`${prefix}${key}`]
  }
  return result
}
const sortKeys = (record) => Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)))

const englishMessages = readJson(join(MESSAGES, `${SOURCE_MESSAGES}.json`))
const englishMessageList = flatten(englishMessages)

/** Everything one language still needs of one kind ("message" or "content"): [{ key, kind, where, text }]. */
function missingWork(language, inventory, kind) {
  const work = []
  if (kind === "message") {
    const existing = Object.fromEntries(flatten(readJson(join(MESSAGES, `${language}.json`), {})))
    for (const [key, text] of englishMessageList)
      if (!existing[key]?.trim()) work.push({ key, kind, where: `menu text ${key}`, text })
  } else {
    const { translations = {} } = readJson(join(CONTENT, `${language}.json`), {})
    for (const [key, entry] of inventory)
      if (!translations[key]?.trim()) work.push({ key, kind, where: [...entry.files][0], text: entry.text })
  }
  return work
}

function save(language, accepted, inventory, kind) {
  if (kind === "message") {
    const values = Object.fromEntries(flatten(readJson(join(MESSAGES, `${language}.json`), {})))
    for (const item of accepted) values[item.key] = item.target
    if (Object.keys(values).length) writeJson(join(MESSAGES, `${language}.json`), rebuild(englishMessages, values))
    return
  }
  const file = readJson(join(CONTENT, `${language}.json`), { translations: {}, templates: {} })
  const translations = {}
  const templates = {}
  for (const item of accepted) file.translations[item.key] = item.target
  // Keep only what the site still uses; ct() matches patterns like "{v0} | VETUD Learn" as templates.
  for (const [key, entry] of inventory) {
    const target = file.translations[key]
    if (!target) continue
    translations[key] = target
    if (/\{v\d+\}/.test(entry.text)) templates[key] = { source: entry.text, target }
  }
  if (Object.keys(translations).length)
    writeJson(join(CONTENT, `${language}.json`), {
      translations: sortKeys(translations),
      templates: sortKeys(templates),
    })
}

// ---- Prompts -----------------------------------------------------------------------------------

function systemPrompt(language) {
  const style = LANGUAGE_STYLE[language]
  const plural = new Intl.PluralRules(language).resolvedOptions().pluralCategories.join(", ")
  const reference = existsSync(join(MESSAGES, `${language}.json`))
    ? readFileSync(join(MESSAGES, `${language}.json`), "utf8")
    : ""
  return `You translate the website text of ${SITE}

Translate from English into ${style.name}. People read these pages to understand what research says, so \
the translation must be easy to understand for a non-expert native speaker.

Rules:
1. Write natural, plain ${style.name}. Translate the meaning, not word for word. Keep the factual, careful \
tone: never make a claim stronger, weaker or more certain than the English.
2. Never add doses, amounts, instructions, advice or warnings that the English doesn't have, and never \
leave any out.
3. Keep every number, unit, percentage, date, measurement and citation exactly as in the English (you may \
use ${style.name} decimal and thousands separators).
4. Keep placeholders exactly as written: {v0}, {count}, {name} and the like. In ICU messages such as \
"{count, plural, one {# guide} other {# guides}}" translate only the words inside the branches and use \
the plural categories ${style.name} needs (${plural}). Keep markup tags (<slot1>…</slot1>, <link>…</link>, \
<b>…</b>) around the matching words. In links written as [text](url) translate the text and keep the url.
5. Keep these exactly as written: ${GLOSSARY.keepAsWritten.join(", ")}.
${GLOSSARY.notes.map((note) => `   - ${note}`).join("\n")}
6. Address the reader with ${style.address}.
7. Short labels (buttons, menus, headings) stay short. Keep line breaks and list markers.
8. Each item says where it appears. Items from the same file belong together: use the same words for \
the same things throughout.

Return every id you were given exactly once.${
    reference
      ? `

The site's existing ${style.name} menu text, for consistent wording:
${reference}`
      : ""
  }`
}

const TRANSLATION_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: { id: { type: "string" }, text: { type: "string" } },
        required: ["id", "text"],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
}
const REVIEW_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: { id: { type: "string" }, ok: { type: "boolean" }, text: { type: "string" } },
        required: ["id", "ok", "text"],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
}

function translateRequest(language, group, retry = false) {
  const items = group.map((item, index) => ({
    id: `i${index}`,
    where: item.where,
    text: item.text,
    ...(retry ? { previous_attempt: item.target, problems: item.problems } : {}),
  }))
  const intro = retry
    ? "These translations were rejected by an automatic check. Translate each item again and fix the problems listed."
    : "Translate the text of each item."
  return params(language, `${intro}\n\n${JSON.stringify(items, null, 1)}`, TRANSLATION_SCHEMA)
}

function reviewRequest(language, group) {
  const items = group.map((item, index) => ({
    id: `i${index}`,
    where: item.where,
    english: item.text,
    translation: item.target,
  }))
  return params(
    language,
    `Check each translation against the English. It must say the same thing, follow the rules above and read naturally to a native speaker. If it does, return ok true and an empty text. If it doesn't, return ok false and the full corrected translation.\n\n${JSON.stringify(items, null, 1)}`,
    REVIEW_SCHEMA,
  )
}

function params(language, user, schema) {
  return {
    model: MODEL,
    max_tokens: 32000,
    thinking: { type: "adaptive" },
    output_config: { effort: "high", format: { type: "json_schema", schema } },
    system: [{ type: "text", text: systemPrompt(language), cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: user }],
  }
}

function groups(work) {
  const result = []
  let current = []
  let size = 0
  for (const item of [...work].sort((a, b) => a.where.localeCompare(b.where))) {
    if (current.length && (size + item.text.length > GROUP_CHARACTERS || current.length >= GROUP_ITEMS)) {
      result.push(current)
      current = []
      size = 0
    }
    current.push(item)
    size += item.text.length
  }
  if (current.length) result.push(current)
  return result
}

// ---- Calling Claude ----------------------------------------------------------------------------

let client
const api = () => (client ??= new Anthropic())

/** The JSON items of a reply, or why there are none. */
function readReply(message) {
  if (message.stop_reason === "refusal") return { problem: "refusal" }
  if (message.stop_reason === "max_tokens") return { problem: "too long" }
  try {
    return {
      items: JSON.parse(
        message.content
          .filter((block) => block.type === "text")
          .map((block) => block.text)
          .join(""),
      ).items,
    }
  } catch {
    return { problem: "unreadable reply" }
  }
}

async function direct(request) {
  // Outside batches, a declined request is retried on another model by the API itself.
  const message = await api()
    .beta.messages.stream({ ...request, betas: [FALLBACK_BETA], fallbacks: "default" })
    .finalMessage()
  return readReply(message)
}

/** Runs requests ({ id, params }) and returns Map(id → { items } | { problem }). */
async function run(label, requests) {
  const replies = new Map()
  if (!requests.length) return replies
  if (DIRECT || requests.length <= 2) {
    let next = 0
    const worker = async () => {
      while (next < requests.length) {
        const request = requests[next++]
        try {
          replies.set(request.id, await direct(request.params))
        } catch (error) {
          replies.set(request.id, { problem: error.message })
        }
        process.stdout.write(`\r${label}: ${replies.size}/${requests.length}`)
      }
    }
    await Promise.all(Array.from({ length: 4 }, worker))
    process.stdout.write("\n")
    return replies
  }

  // The same requests reuse the batch already sent, so a stopped run continues where it was.
  mkdirSync(CACHE, { recursive: true })
  const statePath = join(CACHE, "batches.json")
  const state = readJson(statePath, {})
  const fingerprint = createHash("sha256").update(JSON.stringify(requests)).digest("hex")
  let batchId = state[fingerprint]
  if (!batchId) {
    const batch = await api().messages.batches.create({
      requests: requests.map(({ id, params }) => ({ custom_id: id, params })),
    })
    batchId = batch.id
    writeJson(statePath, { ...state, [fingerprint]: batchId })
    console.log(`${label}: sent batch ${batchId} (${requests.length} requests)`)
  } else console.log(`${label}: continuing batch ${batchId}`)

  for (;;) {
    const batch = await api().messages.batches.retrieve(batchId)
    const counts = batch.request_counts
    process.stdout.write(
      `\r${label}: ${counts.succeeded + counts.errored + counts.expired + counts.canceled}/${requests.length} done, ${counts.processing} in progress   `,
    )
    if (batch.processing_status === "ended") break
    await new Promise((resolve) => setTimeout(resolve, 30_000))
  }
  process.stdout.write("\n")
  for await (const result of await api().messages.batches.results(batchId)) {
    replies.set(
      result.custom_id,
      result.result.type === "succeeded" ? readReply(result.result.message) : { problem: result.result.type },
    )
  }
  // A refused, cut-off or failed request is tried once more on its own (outside the batch).
  const again = requests.filter((request) => replies.get(request.id)?.problem)
  for (const request of again) {
    try {
      replies.set(request.id, await direct(request.params))
    } catch (error) {
      replies.set(request.id, { problem: error.message })
    }
  }
  return replies
}

// ---- The run -----------------------------------------------------------------------------------

function check(item, target) {
  const keep = GLOSSARY.keepAsWritten
  return item.kind === "message" ? checkMessage(item.text, target, keep) : checkContent(item.text, target, keep)
}

/** Applies replies to their groups; returns the items whose translation passed the checks. */
function apply(plan, replies, { review = false } = {}) {
  const failed = []
  for (const { id, group } of plan) {
    const reply = replies.get(id)
    const byId = new Map((reply?.items ?? []).map((entry) => [entry.id, entry]))
    group.forEach((item, index) => {
      const entry = byId.get(`i${index}`)
      if (review) {
        if (!entry || entry.ok || !entry.text.trim()) return
        // A correction replaces the first translation only if it passes the checks too.
        if (!check(item, entry.text).length) {
          item.target = entry.text
          item.corrected = true
        }
        return
      }
      item.target = entry?.text
      item.problems = entry ? check(item, entry.text) : [reply?.problem ?? "missing from the reply"]
      if (item.problems.length) failed.push(item)
    })
  }
  return failed
}

function estimate(work) {
  const characters = work.reduce((sum, item) => sum + item.text.length, 0)
  const requests = groups(work).length
  const systemTokens = 2500
  const input = requests * systemTokens + characters / 3.5
  const output = (characters / 3) * 2.2 // translation plus thinking
  const reviewInput = input + characters / 3
  const reviewOutput = output * 0.4
  const factor = DIRECT ? 1 : 0.5
  const dollars =
    (((input + (REVIEW ? reviewInput : 0)) * PRICE.input + (output + (REVIEW ? reviewOutput : 0)) * PRICE.output) /
      1e6) *
    factor
  return { characters, requests, dollars }
}

const KINDS = { messages: ["message"], content: ["content"] }[ONLY] ?? ["message", "content"]
const inventory = KINDS.includes("content") ? await collectInventory() : new Map()

/** Translates, checks and reviews one kind of text for every language. Menus go first, so page text follows their wording. */
async function translateKind(kind) {
  const label = kind === "message" ? "menu texts" : "page texts"
  const work = new Map(languages.map((language) => [language, missingWork(language, inventory, kind)]))
  const plan = [...work].flatMap(([language, items]) =>
    groups(items).map((group, index) => ({ id: `${kind}-${language}-${index}`, language, group })),
  )
  if (!plan.length) {
    for (const language of languages) save(language, [], inventory, kind) // still drops entries the site no longer uses
    console.log(`All ${label} are translated.`)
    return 0
  }

  let failed = apply(
    plan,
    await run(
      `Translating ${label}`,
      plan.map(({ id, language, group }) => ({ id, params: translateRequest(language, group) })),
    ),
  )
  if (failed.length) {
    const retryPlan = languages.flatMap((language) =>
      groups(failed.filter((item) => work.get(language).includes(item))).map((group, index) => ({
        id: `${kind}-${language}-retry-${index}`,
        language,
        group,
      })),
    )
    failed = apply(
      retryPlan,
      await run(
        `Fixing rejected ${label}`,
        retryPlan.map(({ id, language, group }) => ({ id, params: translateRequest(language, group, true) })),
      ),
    )
  }

  const passed = (language) => work.get(language).filter((item) => item.target && !item.problems?.length)
  if (REVIEW) {
    const reviewPlan = languages.flatMap((language) =>
      groups(passed(language)).map((group, index) => ({ id: `${kind}-${language}-review-${index}`, language, group })),
    )
    apply(
      reviewPlan,
      await run(
        `Reviewing ${label}`,
        reviewPlan.map(({ id, language, group }) => ({ id, params: reviewRequest(language, group) })),
      ),
      { review: true },
    )
  }

  for (const language of languages) {
    const accepted = passed(language)
    save(language, accepted, inventory, kind)
    if (!work.get(language).length) continue
    const corrected = accepted.filter((item) => item.corrected).length
    const english = accepted.filter((item) => keptInEnglish(item.text, item.target)).length
    const rejected = work.get(language).length - accepted.length
    console.log(
      `${language}: ${accepted.length} ${label} saved${REVIEW ? `, ${corrected} improved by the review` : ""}${english ? `, ${english} left in English (titles and citations?)` : ""}${rejected ? `, ${rejected} rejected` : ""}`,
    )
  }
  for (const item of failed.slice(0, 30))
    console.log(`  rejected (${item.where}): ${item.text.slice(0, 80)} → ${item.problems.join("; ")}`)
  return failed.length
}

let total = 0
for (const language of languages) {
  const items = KINDS.flatMap((kind) => missingWork(language, inventory, kind))
  const { characters, requests, dollars } = estimate(items)
  total += dollars
  console.log(
    `${language}: ${items.filter((item) => item.kind === "message").length} menu texts, ${items.filter((item) => item.kind === "content").length} page texts (${characters.toLocaleString("en")} characters, ${requests} requests), about $${dollars.toFixed(2)}`,
  )
}
console.log(
  `Estimated cost: about $${total.toFixed(2)} (${DIRECT ? "direct" : "batch"}${REVIEW ? ", with review" : ""})`,
)
if (DRY_RUN) process.exit(0)

let rejected = 0
for (const kind of KINDS) rejected += await translateKind(kind)
if (rejected) {
  console.log(
    `${rejected} texts were rejected twice. Run \`npm run translate\` again to retry them, or translate them by hand.`,
  )
  process.exitCode = 1
}
