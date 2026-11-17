import type { HttpTypes } from "@medusajs/types"
import { getProductOverview } from "./product-overview"
import type { Source } from "./research/peptides"

/** Small, source-linked excerpts for the homepage; full profiles stay on the server. */
export type CollectionResearch = {
  focus: string
  headline: string
  study: string
  evidence: string
  source?: Source
}

type Brief = Omit<CollectionResearch, "source"> & { sourceIndex?: number }

// Results describe the material and population actually studied, never the shop product.
// In particular, Melanotan I and II, individual ingredients and blends are kept separate.
const BRIEFS: Record<string, Brief> = {
  retatrutide: {
    focus: "Appetite & metabolic research",
    headline: "24.2% average weight loss at 48 weeks",
    study: "A 2023 randomized phase 2 trial enrolled 338 adults with obesity or overweight. The highest treatment group lost 24.2% on average, compared with 2.1% on placebo.",
    evidence: "Human trial",
  },
  tirzepatide: {
    focus: "Appetite & blood-sugar research",
    headline: "20.9% average weight loss at 72 weeks",
    study: "SURMOUNT-1 enrolled 2,539 adults with obesity or overweight, without diabetes. The highest treatment group lost 20.9% on average, versus 3.1% on placebo, alongside lifestyle support.",
    evidence: "Human trial",
  },
  semaglutide: {
    focus: "Appetite & blood-sugar research",
    headline: "14.9% average weight loss at 68 weeks",
    study: "STEP 1 enrolled 1,961 adults with obesity or overweight, without diabetes. Average weight loss was 14.9% with semaglutide versus 2.4% with placebo; both groups received lifestyle support.",
    evidence: "Human trial",
  },
  "bpc-157": {
    focus: "Tendon, muscle & tissue-repair research",
    headline: "Repair findings are mainly from animals",
    study: "A 2025 systematic review found mostly animal studies of tissue repair and very limited human evidence. Controlled human trials are needed to establish healing benefits and safety.",
    evidence: "Research review",
  },
  "tb-500": {
    focus: "Cell movement & tissue-repair research",
    headline: "Human healing benefits remain unproven",
    study: "Research on the full thymosin beta-4 protein explores cell movement and wound repair. Those findings do not establish the same effects for the shorter TB-500 fragment sold here.",
    evidence: "Research review",
  },
  ipamorelin: {
    focus: "Growth-hormone signaling research",
    headline: "A surgical-recovery trial found no clear benefit",
    study: "A randomized phase 2 study analyzed 114 bowel-surgery patients. Time to the first tolerated meal was shorter with ipamorelin, but the difference from placebo was not statistically significant.",
    evidence: "Human trial",
    sourceIndex: 1,
  },
  tesamorelin: {
    focus: "Growth-hormone & visceral-fat research",
    headline: "15.2% less visceral fat at 26 weeks",
    study: "A randomized trial enrolled 412 adults with HIV and excess abdominal fat. Visceral fat fell 15.2% versus a 5.0% rise on placebo. This measured fat around organs, not whole-body weight loss.",
    evidence: "Human trial",
  },
  "ghk-cu": {
    focus: "Skin remodeling & collagen research",
    headline: "Early evidence concerns topical skin care",
    study: "A 2018 review describes cell, animal and small cosmetic studies of copper-peptide skin products. These findings do not establish equivalent effects for other formulations or routes of use.",
    evidence: "Research review",
  },
  "melanotan-ii": {
    focus: "Melanin & pigmentation research",
    headline: "An early pigmentation pilot in just three men",
    study: "A 1996 phase 1 pilot examined pigmentation and short-term effects in three volunteers. This tiny study cannot establish long-term safety; results for Melanotan I do not apply to Melanotan II.",
    evidence: "Small human pilot",
    sourceIndex: 1,
  },
  "melanotan-i": {
    focus: "Pigmentation & light-sensitivity research",
    headline: "69 vs 41 hours of pain-free daylight",
    study: "In a six-month US trial in people with a rare light-sensitivity disease, median pain-free daylight exposure was 69 hours with an afamelanotide implant versus 41 with placebo. This studied an implant medicine.",
    evidence: "Human trial",
  },
  "decapeptide-12": {
    focus: "Melanin & uneven skin-tone research",
    headline: "A 16-week topical melasma pilot",
    study: "Five women used a peptide cream on one side of the face and placebo cream on the other. Investigators reported improvement, but this very small topical study does not establish effects of other formats.",
    evidence: "Small human pilot",
    sourceIndex: 1,
  },
  selank: {
    focus: "Anxiety & brain-signaling research",
    headline: "Small studies explore anxiety symptoms",
    study: "A 2015 study compared Selank plus phenazepam with phenazepam alone in 70 adults with anxiety. The authors reported added benefits; larger independent trials are needed.",
    evidence: "Small human study",
    sourceIndex: 1,
  },
  semax: {
    focus: "Brain signaling & stroke-recovery research",
    headline: "Studied as an addition to stroke care",
    study: "A 2018 Russian clinical study examined Semax alongside standard care after stroke. Reported recovery findings do not establish cognitive benefits in healthy people; larger independent trials are needed.",
    evidence: "Human study",
  },
  "mots-c": {
    focus: "Mitochondria & metabolic research",
    headline: "Metabolic findings from mice",
    study: "The 2015 discovery study reported improved insulin sensitivity and protection from diet-induced obesity in mice. It does not establish a weight-loss effect in people.",
    evidence: "Animal & cell study",
  },
  "5-amino-1mq": {
    focus: "Fat-cell metabolism research",
    headline: "Weight and fat changes studied in mice",
    study: "A 2018 study tested inhibition of the NNMT enzyme in mice with diet-induced obesity. Body weight and fat decreased; human effectiveness and long-term safety remain unestablished. This compound is not a peptide.",
    evidence: "Animal study",
  },
  "aod-9604": {
    focus: "Fat-metabolism research",
    headline: "Human weight-loss benefit is not established",
    study: "Early work examined a growth-hormone fragment in fat-metabolism models. The cited preclinical findings do not establish effective weight loss in people.",
    evidence: "Preclinical research",
  },
  "ara-290": {
    focus: "Small-nerve-fiber research",
    headline: "A 28-day study of nerve-fiber changes",
    study: "A randomized trial in people with sarcoidosis-related small-fiber neuropathy reported changes in corneal nerve fibers. This specific patient study does not establish general nerve-repair benefits.",
    evidence: "Human trial",
  },
  dsip: {
    focus: "Sleep & brain-signaling research",
    headline: "Sleep-study findings remain mixed",
    study: "Small studies have explored sleep after DSIP, with inconsistent results. The research reviewed does not establish a reliable improvement in sleep or a clear long-term safety profile.",
    evidence: "Research review",
  },
  "igf-1-lr3": {
    focus: "Growth-factor signaling research",
    headline: "An animal study found no growth improvement",
    study: "A 2025 study in growth-restricted fetal sheep did not find improved growth with IGF-1 LR3. It does not establish muscle-building or performance benefits in people.",
    evidence: "Animal study",
  },
  kpv: {
    focus: "Gut inflammation research",
    headline: "Reduced inflammation in mouse colitis models",
    study: "A 2008 study examined KPV uptake by gut cells and inflammation in mice with colitis. These laboratory and animal findings have not established an effective treatment in people.",
    evidence: "Animal & cell study",
  },
  "nad-plus": {
    focus: "Cellular energy & aging research",
    headline: "A cellular coenzyme, not a peptide",
    study: "A 2024 review discusses NAD+ biology and approaches to changing its levels. It does not establish that the research product shown reverses aging or improves energy in people.",
    evidence: "Research review",
  },
  "pt-141": {
    focus: "Sexual-desire signaling research",
    headline: "Two trials studied desire and related distress",
    study: "The RECONNECT trials enrolled 1,267 premenopausal women with low sexual desire and related distress. Bremelanotide improved desire and distress scores versus placebo; findings apply to that specific clinical population.",
    evidence: "Human trials",
  },
  "ss-31": {
    focus: "Mitochondrial-function research",
    headline: "A long-term follow-up in Barth syndrome",
    study: "A 168-week open-label extension followed ten people with Barth syndrome and reported improved walking measures. Without a continuing placebo group, it cannot establish general anti-aging or exercise benefits.",
    evidence: "Small open-label study",
    sourceIndex: 1,
  },
  glutathione: {
    focus: "Antioxidant & oxidative-stress research",
    headline: "A naturally occurring cellular antioxidant",
    study: "A 2004 research review describes glutathione metabolism and its role in protecting cells from oxidative stress. This is background research, not a clinical trial of the product shown.",
    evidence: "Research review",
  },
}

const BLENDS: Record<string, string> = {
  "cjc-1295-ipamorelin": "Growth-hormone signaling research",
  "glow-blend": "Skin & tissue-repair research",
  "klow-blend": "Inflammation & tissue-repair research",
  "wolverine-blend": "Tissue-repair research",
}

/** Called on the server so the carousel receives only its short research excerpts. */
export function getCollectionResearch(product: HttpTypes.StoreProduct): CollectionResearch {
  const overview = getProductOverview(product)
  const handle = product.handle ?? ""
  const brief = BRIEFS[handle]
  if (brief) {
    const { sourceIndex = 0, ...copy } = brief
    return { ...copy, source: overview?.guides[0]?.sources[sourceIndex] ?? overview?.sources[sourceIndex] }
  }
  if (BLENDS[handle] || (overview?.guides.length ?? 0) > 1) {
    return {
      focus: BLENDS[handle] ?? "Peptide-combination research",
      headline: "Ingredient findings are not blend trial results",
      study: "Published work on individual ingredients does not establish the effects of this combination. The research profiles describe each ingredient; no published trial of this blend is cited.",
      evidence: "No blend trial cited",
    }
  }
  if (handle === "bacteriostatic-water") {
    return {
      focus: "Laboratory preparation",
      headline: "A research diluent, not an active peptide",
      study: "Used to prepare compatible laboratory materials. This is a supply product rather than a peptide with a clinical outcome; consult its product details for composition and handling.",
      evidence: "Laboratory supply",
    }
  }
  return {
    focus: "Research overview",
    headline: overview?.summary || "Explore this material and its documentation",
    study: overview?.findings[0] || overview?.sections.find(section => section.title === "How it works")?.text || "No clinical trial summary is available for this product. Open the product page to review its research context and documentation.",
    evidence: "Research summary",
    source: overview?.sources[0],
  }
}
