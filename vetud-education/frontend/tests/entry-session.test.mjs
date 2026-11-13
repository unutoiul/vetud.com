import assert from "node:assert/strict"
import { test } from "node:test"
import { entryVisitor, rememberEntryVisitor } from "../src/components/welcome/entry-session.ts"

test("site entry remembers only an adult answer across this tab's reloads and removes legacy names", () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window")
  const values = new Map()
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    sessionStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) },
  } })
  try {
    assert.equal(entryVisitor(), null)
    assert.equal(rememberEntryVisitor(false), null)
    assert.equal(values.size, 0)
    assert.deepEqual(rememberEntryVisitor(true), { adult: true })
    assert.deepEqual(entryVisitor(), { adult: true })
    assert.equal(values.get("vetud_education_entry_v2"), '{"adult":true}')

    for (const invalid of ["broken", "null", "true", '{}', '{"adult":false}', '{"adult":"true"}']) {
      values.set("vetud_education_entry_v2", invalid)
      assert.equal(entryVisitor(), null)
    }
    values.clear()
    assert.equal(entryVisitor(), null)

    values.set("vetud_education_entry_v1", '{"name":"Sam","adult":true}')
    assert.deepEqual(entryVisitor(), { adult: true })
    assert.equal(values.has("vetud_education_entry_v1"), false)
    assert.equal(values.get("vetud_education_entry_v2"), '{"adult":true}')

    Object.defineProperty(window, "sessionStorage", { get() { throw new Error("Storage blocked") } })
    assert.equal(entryVisitor(), null)
    assert.deepEqual(rememberEntryVisitor(true), { adult: true })
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow)
    else delete globalThis.window
  }
})
