import { containsDose, containsLink, screenPost } from "../forum/moderation"
import { publicAuthor, publicPost, type PostRecord, type ProfileRecord } from "../forum/public"
import { computeReputation, levelFor } from "../forum/reputation"
import { DISPLAY_NAME_PATTERN, excerptOf, handleFor, isReservedHandle, normalizeBody, slugify, suggestedDisplayName } from "../forum/text"

describe("forum moderation", () => {
  it("finds dose amounts in the usual spellings", () => {
    for (const text of ["I used 250 mcg", "2.4mg weekly", "10 IU", "0,5 ml", "20 units", "4 clicks", "100µg", "5 MG"]) {
      expect(containsDose(text)).toBe(true)
    }
  })

  it("leaves body measurements and ordinary numbers alone", () => {
    for (const text of ["Down from 92 kg to 86 kg", "waist 96 cm", "week 12", "slept 7.5 h", "lost 4 lb", "Lot VTD01-2609A", "mgmt meeting"]) {
      expect(containsDose(text)).toBe(false)
    }
  })

  it("holds every author's doses, but only new members' links", () => {
    const member = { role: "member", reputation: 0 }
    const contributor = { role: "member", reputation: 25 }
    const expert = { role: "expert", reputation: 0 }
    expect(screenPost(["Took 2 mg"], expert)).toBe("dose")
    expect(screenPost(["See https://example.com"], member)).toBe("link")
    expect(screenPost(["See www.example.com"], member)).toBe("link")
    expect(screenPost(["See https://example.com"], contributor)).toBeNull()
    expect(screenPost(["See https://example.com"], expert)).toBeNull()
    expect(screenPost(["Week 8: sleeping better", null], member)).toBeNull()
    expect(containsLink("version 2.0 is out")).toBe(false)
  })

  it("holds new members' photos, and doses before photos", () => {
    const member = { role: "member", reputation: 0 }
    const contributor = { role: "member", reputation: 25 }
    expect(screenPost(["Week 4 progress"], member, 2)).toBe("image")
    expect(screenPost(["Week 4 progress"], member, 0)).toBeNull()
    expect(screenPost(["Week 4 progress"], contributor, 2)).toBeNull()
    expect(screenPost(["Took 2 mg"], contributor, 1)).toBe("dose")
  })
})

describe("forum reputation", () => {
  it("adds up points and never goes below zero", () => {
    expect(computeReputation({ helpfulVotes: 3, bestAnswers: 1, removedPosts: 0 })).toBe(21)
    expect(computeReputation({ helpfulVotes: 0, bestAnswers: 0, removedPosts: 2 })).toBe(0)
  })

  it("maps reputation to levels", () => {
    expect(levelFor(0).id).toBe("member")
    expect(levelFor(24).id).toBe("member")
    expect(levelFor(25).id).toBe("contributor")
    expect(levelFor(100).id).toBe("trusted")
    expect(levelFor(1000).id).toBe("lead")
  })
})

describe("forum text", () => {
  it("normalizes posts and titles", () => {
    expect(normalizeBody("  one\r\n\r\n\r\n\r\ntwo ​ ")).toBe("one\n\ntwo")
    expect(slugify("Week 12 on BPC-157: recovery notes!")).toBe("week-12-on-bpc-157-recovery-notes")
    expect(slugify("¡¿")).toBe("thread")
    expect(excerptOf("word ".repeat(100), 40).endsWith("…")).toBe(true)
  })

  it("suggests names and keeps staff names for the team", () => {
    expect(suggestedDisplayName("Lucas", "Franco")).toBe("Lucas F.")
    expect(suggestedDisplayName(null, "Franco")).toBe("")
    expect(handleFor("Lucas F.")).toBe("lucas-f")
    expect(handleFor("Иван", () => "x7k2p9")).toBe("member-x7k2p9")
    expect(DISPLAY_NAME_PATTERN.test("Иван")).toBe(true)
    expect(isReservedHandle(handleFor("Vetud Support"))).toBe(true)
    expect(isReservedHandle(handleFor("Vetudfan"))).toBe(false)
    expect(DISPLAY_NAME_PATTERN.test("Lucas F.")).toBe(true)
    expect(DISPLAY_NAME_PATTERN.test("<b>")).toBe(false)
    expect(DISPLAY_NAME_PATTERN.test("ab")).toBe(false)
  })
})

describe("forum public projections", () => {
  const profile: ProfileRecord = {
    id: "fprof_1", customer_id: "cus_1", display_name: "Dr Ana", handle: "dr-ana", role: "expert",
    credentials: "MD, endocrinology", bio: null, reputation: 120, status: "active", created_at: "2026-11-01",
  }
  const post: PostRecord = {
    id: "fpost_1", thread_id: "fthr_1", author_id: "fprof_1", body: "Hello", is_opening: false,
    status: "pending", hold_reason: "link", helpful_count: 0, edited_at: null, created_at: "2026-11-02",
  }

  it("never exposes the customer and shows moderation details only to the author", () => {
    const authors = new Map([[profile.id, profile]])
    const forOthers = publicPost(post, { authors, viewer: null })
    expect(JSON.stringify(forOthers)).not.toContain("cus_1")
    expect(forOthers).not.toHaveProperty("status")
    expect(forOthers.author).toMatchObject({ display_name: "Dr Ana", credentials: "MD, endocrinology", level_id: "trusted" })
    expect(publicPost(post, { authors, viewer: profile })).toMatchObject({ mine: true, status: "pending", hold_reason: "link" })
  })

  it("hides credentials unless the member is an expert, and covers deleted profiles", () => {
    expect(publicAuthor({ ...profile, role: "member" }).credentials).toBeNull()
    expect(publicAuthor(undefined).display_name).toBe("Former member")
  })
})
