const DISMISSED_KEY = "vetud_education_welcome_dismissed"

/** A tab-scoped preference; it contains no signup or personal information. */
export function welcomeDismissedInSession() {
  try {
    return window.sessionStorage.getItem(DISMISSED_KEY) === "1"
  } catch {
    return false
  }
}

/** Save synchronously so a destination page or reload sees the dismissal immediately. */
export function dismissWelcomeForSession() {
  try {
    window.sessionStorage.setItem(DISMISSED_KEY, "1")
  } catch {
    // The caller still closes the splash in React when browser storage is blocked.
  }
}
