const DISMISSED_KEY = "vetud_education_welcome_dismissed"
export const WELCOME_COOLDOWN_MS = 5 * 60 * 1000

/** A tab-scoped preference; it contains no signup or personal information. */
export function welcomeCooldownUntil(now = Date.now()) {
  try {
    const until = Number(window.sessionStorage.getItem(DISMISSED_KEY))
    return Number.isFinite(until) && until > now ? until : 0
  } catch {
    return 0
  }
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
