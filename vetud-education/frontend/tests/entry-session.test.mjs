import assert from "node:assert/strict"
import { test } from "node:test"
import { entryName, entryVisitor, rememberEntryVisitor } from "../src/components/welcome/entry-session.ts"

test("site entry requires a name and an adult answer, and lasts across this tab's reloads", () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window")
  const values = new Map()
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    sessionStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) },
  } })
  try {
    assert.equal(entryVisitor(), null)
    assert.equal(rememberEntryVisitor("   ", true), null)
    assert.equal(rememberEntryVisitor("Sam", false), null)
    assert.equal(values.size, 0)
    assert.deepEqual(rememberEntryVisitor("  Sam   Lee  ", true), { name: "Sam Lee", adult: true })
    assert.deepEqual(entryVisitor(), { name: "Sam Lee", adult: true })
    assert.equal(entryName("x".repeat(90)).length, 80)

    for (const invalid of ["broken", "null", "true", '{"name":"Sam","adult":false}', '{"name":" ","adult":true}', '{"name":3,"adult":true}']) {
      values.set("vetud_education_entry_v1", invalid)
      assert.equal(entryVisitor(), null)
    }
    values.clear()
    assert.equal(entryVisitor(), null)

    Object.defineProperty(window, "sessionStorage", { get() { throw new Error("Storage blocked") } })
    assert.equal(entryVisitor(), null)
    assert.deepEqual(rememberEntryVisitor("Sam", true), { name: "Sam", adult: true })
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow)
    else delete globalThis.window
  }
})
