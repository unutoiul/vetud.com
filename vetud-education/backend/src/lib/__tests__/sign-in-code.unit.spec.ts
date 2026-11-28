import {
  checkSignInCode,
  issueSignInCode,
  normalizeEmail,
  secondsUntilResend,
  SIGN_IN_CODE_MAX_ATTEMPTS,
} from "../sign-in-code"

describe("sign-in codes", () => {
  const now = new Date("2026-11-19T10:00:00.000Z")

  it("accepts the code it issued, with spaces typed in it, for that login only", () => {
    const { code, state } = issueSignInCode("login_1", now)
    expect(code).toMatch(/^\d{6}$/)
    expect(checkSignInCode(state, "login_1", code, now)).toBe("ok")
    expect(checkSignInCode(state, "login_1", `${code.slice(0, 3)} ${code.slice(3)}`, now)).toBe("ok")
    expect(checkSignInCode(state, "login_2", code, now)).toBe("wrong")
  })

  it("refuses a wrong, expired or used code, and locks after too many tries", () => {
    const { code, state } = issueSignInCode("login_1", now)
    const other = code === "000000" ? "111111" : "000000"
    expect(checkSignInCode(state, "login_1", other, now)).toBe("wrong")
    expect(checkSignInCode(state, "login_1", "12a", now)).toBe("wrong")
    expect(checkSignInCode(state, "login_1", code, new Date(now.getTime() + 11 * 60_000))).toBe("expired")
    expect(checkSignInCode({ ...state, code_hash: null }, "login_1", code, now)).toBe("expired")
    expect(checkSignInCode({ ...state, attempts: SIGN_IN_CODE_MAX_ATTEMPTS }, "login_1", code, now)).toBe("locked")
    expect(checkSignInCode(undefined, "login_1", code, now)).toBe("expired")
  })

  it("waits 30 seconds before sending another code", () => {
    const { state } = issueSignInCode("login_1", now)
    expect(secondsUntilResend(state, now)).toBe(30)
    expect(secondsUntilResend(state, new Date(now.getTime() + 29_500))).toBe(1)
    expect(secondsUntilResend(state, new Date(now.getTime() + 30_000))).toBe(0)
    expect(secondsUntilResend(null, now)).toBe(0)
  })

  it("treats an address the same whatever its case or spaces", () => {
    expect(normalizeEmail("  Ana@Example.COM ")).toBe("ana@example.com")
  })
})
