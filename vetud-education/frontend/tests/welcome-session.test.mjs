import assert from "node:assert/strict"
import { test } from "node:test"

test("welcome dismissal survives navigation and reloads in the same tab", async () => {
  const values = new Map()
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window")
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    sessionStorage: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
  } })

  try {
    const firstPage = await import("../src/components/welcome/session.ts?first-page")
    assert.equal(firstPage.welcomeDismissedInSession(), false)
    firstPage.dismissWelcomeForSession()

    // A fresh module represents a remount or full navigation, without shared React state.
    const destination = await import("../src/components/welcome/session.ts?destination")
    assert.equal(destination.welcomeDismissedInSession(), true)
    destination.dismissWelcomeForSession()
    assert.equal(destination.welcomeDismissedInSession(), true)

    // A new browser session is eligible to see the welcome again.
    values.clear()
    assert.equal(destination.welcomeDismissedInSession(), false)

    Object.defineProperty(window, "sessionStorage", { get() { throw new Error("Storage blocked") } })
    assert.equal(destination.welcomeDismissedInSession(), false)
    assert.doesNotThrow(() => destination.dismissWelcomeForSession())
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow)
    else delete globalThis.window
  }
})
