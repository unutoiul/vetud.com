const DISMISSED_KEY = "vetud_education_welcome_dismissed"
const CLOSED_KEY = "vetud_education_welcome_closed"
export const WELCOME_COOLDOWN_MS = 30 * 1000

/** A tab-scoped preference; it contains no signup or personal information. */
export function welcomeCooldownUntil(now = Date.now()) {
  try {
    const until = Number(window.sessionStorage.getItem(DISMISSED_KEY))
    // Shorten a cooldown saved by an older version of the site to the new interval.
    if (Number.isFinite(until) && until > now + WELCOME_COOLDOWN_MS) return dismissWelcomeForSession(now)
    return Number.isFinite(until) && until > now ? until : 0
  } catch {
    return 0
  }
}

/** Start the first reminder, while preserving a running or already-expired reminder on reload. */
export function startWelcomeForSession(now = Date.now()) {
  try {
    if (window.sessionStorage.getItem(DISMISSED_KEY) !== null) return welcomeCooldownUntil(now)
  } catch {
    // Keep the initial delay in React if storage is blocked.
  }
  return dismissWelcomeForSession(now)
}

/** Save synchronously so a destination page or reload sees the dismissal immediately. */
export function dismissWelcomeForSession(now = Date.now()) {
  const until = now + WELCOME_COOLDOWN_MS
  try {
    window.sessionStorage.setItem(DISMISSED_KEY, String(until))
  } catch {
    // The caller still closes the splash in React when browser storage is blocked.
  }
  return until
}

/**
 * Once skipped or closed, the newsletter offer stays closed for the rest of the visit (this tab).
 * It used to return every 30 seconds; Meta treats repeated pop-ups as a disruptive landing page.
 */
export function welcomeClosedForVisit() {
  try {
    return window.sessionStorage.getItem(CLOSED_KEY) === "1"
  } catch {
    return false
  }
}

export function closeWelcomeForVisit() {
  try {
    window.sessionStorage.setItem(CLOSED_KEY, "1")
  } catch {
    // The caller still keeps it closed in React when browser storage is blocked.
  }
}
