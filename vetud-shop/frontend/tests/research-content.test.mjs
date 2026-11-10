import assert from "node:assert/strict"
import { register } from "node:module"
import { test } from "node:test"

register("./helpers/resolve-ts.mjs", import.meta.url)
const { EVIDENCE_STEPS } = await import("../src/content/research/categories.ts")
const { PEPTIDES } = await import("../src/content/research/peptides.ts")

// The research overview on product pages. Similar to the pattern product-overview.ts filters on.
const DOSE = /\bdos(?:e|es|ed|ing|age)\b|\b\d+(?:[.,]\d+)?\s?(?:mg|mcg|µg|iu|ml)\b/i
const WHO = new Set(["people", "animals", "cells", "review"])
const STEPS = new Set(EVIDENCE_STEPS.map((step) => step.id))

test("every charted result names who was studied and links one of its profile's sources", () => {
  for (const peptide of PEPTIDES) {
    for (const result of peptide.results ?? []) {
      const where = `${peptide.slug}: ${result.title}`
      assert.ok(WHO.has(result.who), `${where} needs a valid "who"`)
      assert.ok(Number.isInteger(result.source) && peptide.sources[result.source], `${where} points at a missing source`)
      assert.ok(result.study.trim(), `${where} needs a study description`)
      assert.ok(result.bars?.length || result.finding, `${where} needs bars or a finding`)
      for (const bar of result.bars ?? []) assert.ok(Number.isFinite(bar.value) && bar.value >= 0 && bar.label.trim(), `${where} has an invalid bar`)
    }
  }
})

test("results and unknowns never mention doses", () => {
  for (const peptide of PEPTIDES) {
    const texts = [...(peptide.results ?? []).flatMap((result) => [result.title, result.study, result.finding ?? "", ...(result.bars ?? []).map((bar) => bar.label)]), ...(peptide.unknowns ?? [])]
    for (const text of texts) assert.doesNotMatch(text, DOSE, `${peptide.slug}: "${text}"`)
  }
})

test("evidence steps are valid and profiles with results say how strong the evidence is", () => {
  for (const peptide of PEPTIDES) {
    if (peptide.evidence) assert.ok(STEPS.has(peptide.evidence), `${peptide.slug} has an unknown evidence step`)
    if (peptide.results?.length) assert.ok(peptide.evidence, `${peptide.slug} has results but no evidence step`)
  }
})
