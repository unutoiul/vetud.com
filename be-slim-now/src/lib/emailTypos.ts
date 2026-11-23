/**
 * Spots a likely typo in an email's domain ("gmial.com", "hotmail.con") and suggests the fix, so a
 * subscriber doesn't lose their code to a misspelt address. Only well-known mail providers are
 * corrected; a company domain that merely looks similar is left alone.
 */

/** Provider names (the part before the last dot), as people type them. */
const PROVIDERS = [
  "gmail", "googlemail", "yahoo", "ymail", "hotmail", "outlook", "live", "msn", "icloud", "aol",
  "protonmail", "proton", "gmx", "mail", "email", "web", "t-online", "freenet", "orange", "wanadoo",
  "laposte", "free", "sfr", "libero", "virgilio", "alice", "tiscali", "btinternet", "seznam", "centrum",
  "wp", "onet", "interia", "o2", "abv", "yandex", "ziggo", "kpnmail", "telenet", "skynet", "bluewin",
  "inbox", "rambler", "ukr", "telia", "online",
]
/** Providers that only exist under .com, so "gmail.co" or "icloud.de" is a slip too. */
const COM_ONLY = new Set(["gmail", "googlemail", "ymail", "icloud", "aol", "protonmail", "msn"])
/** Endings that are never real: always meant ".com". */
const NOT_A_TLD = new Set(["con", "cmo", "ocm", "cpm", "vom", "xom", "comm", "coom", "cim", "cok", "c0m"])
/** Real endings (Cameroon, Oman, Colombia) that are usually a slip on a well-known provider. */
const NEAR_COM = new Set(["cm", "om", "co"])

/** Edits (insert, delete, swap two neighbours, change one letter) between two words. */
function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
    }
  }
  return d[a.length][b.length]
}

/** The closest provider to a mistyped name, if it's close enough to be a slip. */
function closestProvider(name: string): string | undefined {
  if (PROVIDERS.includes(name) || name.length < 4) return undefined
  const allowed = name.length >= 7 ? 2 : 1
  let best: string | undefined
  let bestDistance = allowed + 1
  for (const provider of PROVIDERS) {
    // Short names match too much ("fred" isn't "free"): fix only longer providers, and a four-letter
    // name only when a letter is missing ("gmai", "yaho").
    if (provider.length < 5 || (name.length === 4 && provider.length !== 5)) continue
    const edits = distance(name, provider)
    if (edits < bestDistance) [best, bestDistance] = [provider, edits]
  }
  return best
}

/** "name@gmial.com" → "name@gmail.com"; undefined when the address looks right. */
export function suggestEmail(email: string): string | undefined {
  const at = email.lastIndexOf("@")
  const dot = email.lastIndexOf(".")
  if (at < 1 || dot < at + 2 || dot === email.length - 1) return undefined
  const local = email.slice(0, at)
  const domain = email.slice(at + 1).toLowerCase()
  const name = domain.slice(0, domain.lastIndexOf("."))
  const tld = domain.slice(domain.lastIndexOf(".") + 1)

  const fixedName = closestProvider(name) ?? name
  const known = PROVIDERS.includes(fixedName)
  let fixedTld = tld
  if (NOT_A_TLD.has(tld)) fixedTld = "com"
  else if (known && (COM_ONLY.has(fixedName) || NEAR_COM.has(tld)) && tld !== "com") fixedTld = "com"

  const fixed = `${fixedName}.${fixedTld}`
  return fixed === domain ? undefined : `${local}@${fixed}`
}
