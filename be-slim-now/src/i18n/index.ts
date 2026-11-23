import type { CountryCode } from "@/config/markets"
import type english from "./messages/us.json"

/**
 * The page text, one file per country in src/i18n/messages (us.json, de.json, gb.json…). us.json is
 * the English source: every other file has the same keys and the same {placeholders}, so a
 * translator only replaces the words. `npm run i18n:sync` adds a file for a new country (a copy of
 * us.json) and copies new keys into every file; `npm run i18n:check` lists anything missing.
 *
 * Prices, percentages and product names are not in these files: they come from src/config.
 */
export type Messages = typeof english

/** One country's text. Each file is its own chunk, so a page only ships its own country's words. */
export async function loadMessages(country: CountryCode): Promise<Messages> {
  const file = (await import(`./messages/${country.toLowerCase()}.json`)) as { default: Messages }
  return file.default
}
