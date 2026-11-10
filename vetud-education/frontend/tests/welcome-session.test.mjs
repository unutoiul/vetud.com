import assert from "node:assert/strict"
import { test } from "node:test"

test("welcome dismissal lasts five minutes across navigation and refreshes", async () => {
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
    const now = 1_800_000_000_000
    const fiveMinutes = 300_000
    assert.equal(firstPage.welcomeCooldownUntil(now), 0)
    assert.equal(firstPage.dismissWelcomeForSession(now), now + fiveMinutes)

    // A fresh module represents a remount or full navigation, without shared React state.
    const destination = await import("../src/components/welcome/session.ts?destination")
    assert.equal(destination.welcomeCooldownUntil(now + 60_000), now + fiveMinutes)
    assert.equal(destination.welcomeCooldownUntil(now + fiveMinutes - 1), now + fiveMinutes)
    assert.equal(destination.welcomeCooldownUntil(now + fiveMinutes), 0)
    assert.equal(destination.welcomeCooldownUntil(now + fiveMinutes + 1), 0)

    // Dismissing the next appearance starts another full cooldown.
    const later = now + fiveMinutes + 30_000
    destination.dismissWelcomeForSession(later)
    assert.equal(destination.welcomeCooldownUntil(later), later + fiveMinutes)

    // A new browser session is eligible to see the welcome again.
    values.clear()
    assert.equal(destination.welcomeCooldownUntil(later), 0)

    // The previous boolean marker and corrupt values must not suppress it forever.
    for (const invalid of ["1", "invalid", "Infinity"]) {
      values.set("vetud_education_welcome_dismissed", invalid)
      assert.equal(destination.welcomeCooldownUntil(now), 0)
    }

    Object.defineProperty(window, "sessionStorage", { get() { throw new Error("Storage blocked") } })
    assert.equal(destination.welcomeCooldownUntil(now), 0)
    // React can still keep the cooldown in memory when storage is blocked.
    assert.equal(destination.dismissWelcomeForSession(now), now + fiveMinutes)
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow)
    else delete globalThis.window
  }
})
