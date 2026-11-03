import { MIN_LOGS_FOR_INSIGHT, quantile, summarizeLogs, type LogForInsight } from "../forum/insights"
import { validateMeasurements } from "../forum/metrics"
import { containsDose, containsLink, screenPost } from "../forum/moderation"
import { publicAuthor, publicPost, type PostRecord, type ProfileRecord } from "../forum/public"
import { hasPaidOrderFor, matchLot } from "../forum/purchase"
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
})

describe("forum reputation", () => {
  it("adds up points and never goes below zero", () => {
    expect(computeReputation({ helpfulVotes: 3, bestAnswers: 1, publishedLogs: 2, removedPosts: 0 })).toBe(31)
    expect(computeReputation({ helpfulVotes: 0, bestAnswers: 0, publishedLogs: 0, removedPosts: 2 })).toBe(0)
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

describe("forum measurements", () => {
  it("requires a starting value for every metric in a new log", () => {
    expect(() => validateMeasurements([], { requireBaseline: true })).toThrow(/starting measurement/)
    expect(() => validateMeasurements([{ metric: "body_weight", week: 8, value: 80 }], { requireBaseline: true })).toThrow(/week 0/)
    expect(validateMeasurements([
      { metric: "body_weight", week: 0, value: 92.456 },
      { metric: "body_weight", week: 8, value: 88 },
    ], { requireBaseline: true })).toEqual([
      { metric: "body_weight", week: 0, value: 92.46 },
      { metric: "body_weight", week: 8, value: 88 },
    ])
  })

  it("rejects unknown metrics, impossible values and duplicates", () => {
    expect(() => validateMeasurements([{ metric: "dose", week: 0, value: 1 }], { requireBaseline: false })).toThrow(/Unknown/)
    expect(() => validateMeasurements([{ metric: "energy", week: 0, value: 11 }], { requireBaseline: false })).toThrow(/between 0 and 10/)
    expect(() => validateMeasurements([{ metric: "energy", week: 200, value: 5 }], { requireBaseline: false })).toThrow(/Weeks/)
    expect(() => validateMeasurements([
      { metric: "energy", week: 0, value: 5 },
      { metric: "energy", week: 0, value: 6 },
    ], { requireBaseline: false })).toThrow(/twice/)
  })
})

describe("forum insights", () => {
  const weightLog = (start: number, end: number, week = 12, stacked = false): LogForInsight => ({
    stacked,
    measurements: [{ metric: "body_weight", week: 0, value: start }, { metric: "body_weight", week, value: end }],
  })

  it("interpolates quantiles", () => {
    expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5)
    expect(quantile([5], 0.25)).toBe(5)
  })

  it("shows nothing until enough logs report a metric", () => {
    const logs = Array.from({ length: MIN_LOGS_FOR_INSIGHT - 1 }, () => weightLog(100, 90))
    expect(summarizeLogs(logs)).toEqual([])
  })

  it("reports median percent change for weight and point change for scores", () => {
    const logs = [weightLog(100, 90), weightLog(100, 95), weightLog(100, 92, 12, true), weightLog(80, 76), weightLog(100, 100)]
    const [weight] = summarizeLogs(logs)
    expect(weight).toMatchObject({ metric: "body_weight", change: "percent", logs: 5, stacked: 1, median: -5, median_weeks: 12 })
    expect(weight.p25).toBeLessThanOrEqual(weight.median)
    expect(weight.curve).toEqual([{ week: 12, logs: 5, median: -5 }])
    // A log measured at week 8 counts towards the week-8 mark, not week 12.
    expect(summarizeLogs([...logs.slice(1), weightLog(100, 90, 8)])[0].curve).toEqual([])

    const scores = Array.from({ length: 5 }, (_, index): LogForInsight => ({
      stacked: false,
      measurements: [{ metric: "sleep_quality", week: 0, value: 4 }, { metric: "sleep_quality", week: 6, value: 4 + index }],
    }))
    expect(summarizeLogs(scores)[0]).toMatchObject({ metric: "sleep_quality", change: "points", median: 2 })
  })

  it("ignores logs without a baseline or a measurement after week 4", () => {
    const logs = [
      ...Array.from({ length: 4 }, () => weightLog(100, 90)),
      weightLog(100, 90, 2),
      { stacked: false, measurements: [{ metric: "body_weight", week: 12, value: 90 }] },
    ]
    expect(summarizeLogs(logs)).toEqual([])
  })
})

describe("forum purchases and lots", () => {
  const paid = { payment_collections: [{ payments: [{ captured_at: "2026-10-01" }] }] }

  it("counts paid, non-canceled orders that contain the product", () => {
    expect(hasPaidOrderFor([{ status: "completed", items: [{ product_id: "prod_1" }], ...paid }], "prod_1")).toBe(true)
    expect(hasPaidOrderFor([{ status: "pending", items: [{ product_id: "prod_1" }], payment_collections: [{ payments: [{ captured_at: null }] }] }], "prod_1")).toBe(false)
    expect(hasPaidOrderFor([{ status: "canceled", items: [{ product_id: "prod_1" }], ...paid }], "prod_1")).toBe(false)
    expect(hasPaidOrderFor([{ status: "completed", is_draft_order: true, items: [{ product_id: "prod_1" }], ...paid }], "prod_1")).toBe(false)
    expect(hasPaidOrderFor([{ status: "completed", items: [{ product_id: "prod_2" }], ...paid }], "prod_1")).toBe(false)
  })

  it("matches lot numbers from product metadata, ignoring case and spaces", () => {
    const lots = "VTD01-2609A|2026-09|99.4%; VTD01-2607B|2026-07|99.2%"
    expect(matchLot(lots, "vtd01-2609a")).toBe("VTD01-2609A")
    expect(matchLot(lots, " VTD01 - 2607B ")).toBe("VTD01-2607B")
    expect(matchLot(lots, "VTD02-2609A")).toBeUndefined()
    expect(matchLot(undefined, "VTD01-2609A")).toBeUndefined()
  })
})

describe("forum public projections", () => {
  const profile: ProfileRecord = {
    id: "fprof_1", customer_id: "cus_1", display_name: "Dr Ana", handle: "dr-ana", role: "expert",
    credentials: "MD, endocrinology", bio: null, reputation: 120, status: "active", created_at: "2026-11-01",
  }
  const post: PostRecord = {
    id: "fpost_1", thread_id: "fthr_1", author_id: "fprof_1", body: "Hello", is_opening: false, kind: "post",
    week: null, status: "pending", hold_reason: "link", helpful_count: 0, edited_at: null, created_at: "2026-11-02",
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
