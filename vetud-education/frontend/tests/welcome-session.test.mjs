import assert from "node:assert/strict"
import { test } from "node:test"

test("newsletter waits thirty seconds after entry and each dismissal across navigation and refreshes", async () => {
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
    const thirtySeconds = 30_000
    assert.equal(firstPage.welcomeCooldownUntil(now), 0)
    assert.equal(firstPage.startWelcomeForSession(now), now + thirtySeconds)
    assert.equal(firstPage.dismissWelcomeForSession(now), now + thirtySeconds)

    // A fresh module represents a remount or full navigation, without shared React state.
    const destination = await import("../src/components/welcome/session.ts?destination")
    assert.equal(destination.startWelcomeForSession(now + 10_000), now + thirtySeconds)
    assert.equal(destination.welcomeCooldownUntil(now + thirtySeconds - 1), now + thirtySeconds)
    assert.equal(destination.welcomeCooldownUntil(now + thirtySeconds), 0)
    assert.equal(destination.startWelcomeForSession(now + thirtySeconds + 1), 0)

    // Dismissing the next appearance starts another full cooldown.
    const later = now + thirtySeconds + 10_000
    destination.dismissWelcomeForSession(later)
    assert.equal(destination.startWelcomeForSession(later), later + thirtySeconds)
    assert.equal(destination.welcomeCooldownUntil(later + thirtySeconds), 0)

    // Existing five-minute dismissals are reduced once, without extending on the next reload.
    values.set("vetud_education_welcome_dismissed", String(later + 300_000))
    assert.equal(destination.startWelcomeForSession(later), later + thirtySeconds)
    assert.equal(destination.startWelcomeForSession(later + 10_000), later + thirtySeconds)

    // A new browser session is eligible to see the welcome again.
    values.clear()
    assert.equal(destination.welcomeCooldownUntil(later), 0)
    assert.equal(destination.startWelcomeForSession(later), later + thirtySeconds)

    // The previous boolean marker and corrupt values must not suppress it forever.
    for (const invalid of ["1", "invalid", "Infinity"]) {
      values.set("vetud_education_welcome_dismissed", invalid)
      assert.equal(destination.welcomeCooldownUntil(now), 0)
    }

    Object.defineProperty(window, "sessionStorage", { get() { throw new Error("Storage blocked") } })
    assert.equal(destination.welcomeCooldownUntil(now), 0)
    // React can still keep the cooldown in memory when storage is blocked.
    assert.equal(destination.startWelcomeForSession(now), now + thirtySeconds)
    assert.equal(destination.dismissWelcomeForSession(now), now + thirtySeconds)
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow)
    else delete globalThis.window
  }
})
