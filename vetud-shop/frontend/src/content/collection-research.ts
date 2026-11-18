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
// Headlines lead with the strongest result (owner request 2026-11-18), but only results the
// linked source reports (see research/peptides.ts); where the evidence is thin, they say so.
const BRIEFS: Record<string, Brief> = {
  retatrutide: {
    focus: "Appetite & metabolic research",
    headline: "24.2% average weight loss in 48 weeks, over 11× placebo",
    study: "A 2023 randomized phase 2 trial enrolled 338 adults with obesity or overweight. The highest treatment group lost 24.2% of their body weight on average, compared with 2.1% on placebo.",
    evidence: "Human trial",
  },
  tirzepatide: {
    focus: "Appetite & blood-sugar research",
    headline: "20.9% average weight loss in 72 weeks, nearly 7× placebo",
    study: "SURMOUNT-1 enrolled 2,539 adults with obesity or overweight, without diabetes. The highest treatment group lost 20.9% on average, versus 3.1% on placebo, alongside lifestyle support.",
    evidence: "Human trial",
  },
  semaglutide: {
    focus: "Appetite & blood-sugar research",
    headline: "14.9% average weight loss in 68 weeks, over 6× placebo",
    study: "STEP 1 enrolled 1,961 adults with obesity or overweight, without diabetes. Average weight loss was 14.9% with semaglutide versus 2.4% with placebo; both groups received lifestyle support.",
    evidence: "Human trial",
  },
  "bpc-157": {
    focus: "Tendon, muscle & tissue-repair research",
    headline: "Faster healing of tendon, muscle & bone in 35 animal studies",
    study: "A 2025 systematic review gathered 35 animal studies of muscle, tendon, ligament and bone injuries, in which the injured tissue healed better with BPC-157. Only one small study in people has been published.",
    evidence: "Review of animal studies",
  },
  "tb-500": {
    focus: "Cell movement & tissue-repair research",
    headline: "A fragment of thymosin beta-4, the body's own repair protein",
    study: "TB-500 is a fragment of thymosin beta-4, a protein that, in lab and animal studies, helps cells travel to wounds. The full protein has reached small human trials as eye drops and wound gels; the fragment itself hasn't been tested in people.",
    evidence: "Research review",
  },
  ipamorelin: {
    focus: "Growth-hormone signaling research",
    headline: "The first selective growth-hormone releaser",
    study: "A 1998 study introduced ipamorelin as the first selective growth-hormone releaser: in lab and animal tests it triggered growth-hormone bursts without raising stress hormones such as cortisol, as earlier releasers did.",
    evidence: "Lab & animal study",
  },
  tesamorelin: {
    focus: "Growth-hormone & visceral-fat research",
    headline: "Visceral fat down 15.2% in 26 weeks, while it rose on placebo",
    study: "A randomized trial enrolled 412 adults with HIV and excess abdominal fat. Visceral fat fell 15.2% versus a 5.0% rise on placebo. This measured fat around organs, not whole-body weight loss.",
    evidence: "Human trial",
  },
  "ghk-cu": {
    focus: "Skin remodeling & collagen research",
    headline: "Firmer skin and softer fine lines in cosmetic studies",
    study: "Lab studies and small cosmetic trials suggest creams with GHK-Cu can improve skin firmness and fine lines. In the lab it encourages skin cells to make collagen; the trials so far are small.",
    evidence: "Research review",
    sourceIndex: 1,
  },
  "melanotan-ii": {
    focus: "Melanin & pigmentation research",
    headline: "Skin darkening in the first small human pilot",
    study: "The 1996 phase 1 pilot gave melanotan II to three men and reported increased skin pigmentation, along with nausea, tiredness and spontaneous erections. No larger trials have followed.",
    evidence: "Small human pilot",
    sourceIndex: 1,
  },
  "melanotan-i": {
    focus: "Pigmentation & light-sensitivity research",
    headline: "68% more pain-free time in daylight",
    study: "In a six-month US trial in people with a rare light-sensitivity disease, median pain-free daylight exposure was 69 hours with an afamelanotide implant versus 41 with placebo. This studied an implant medicine.",
    evidence: "Human trial",
  },
  "decapeptide-12": {
    focus: "Melanin & uneven skin-tone research",
    headline: "Melasma scores down 60% in 16 weeks",
    study: "In an open study of 33 women with melasma, a skin routine built around decapeptide-12 cream lowered melasma severity scores by 60% on average over 16 weeks. The routine also included glycolic acid and sunscreen, and there was no comparison group.",
    evidence: "Small human study",
    sourceIndex: 2,
  },
  selank: {
    focus: "Anxiety & brain-signaling research",
    headline: "Faster anxiety relief, with fewer side effects, when added to treatment",
    study: "In a 2015 study of 70 adults with anxiety disorders, adding Selank to phenazepam, a prescription anti-anxiety medicine, made it work sooner and with fewer side effects such as drowsiness and poor memory, the authors report.",
    evidence: "Small human study",
    sourceIndex: 1,
  },
  semax: {
    focus: "Brain signaling & stroke-recovery research",
    headline: "Better stroke recovery when added to standard care",
    study: "A 2018 Russian clinical study reported better recovery in people after a stroke when Semax was added to their standard care.",
    evidence: "Human study",
  },
  "mots-c": {
    focus: "Mitochondria & metabolic research",
    headline: "Protected mice from diet-induced weight gain",
    study: "In the 2015 discovery study, MOTS-c protected mice on a high-fat diet from weight gain and insulin resistance. It hasn't been tested in human trials.",
    evidence: "Animal & cell study",
  },
  "5-amino-1mq": {
    focus: "Fat-cell metabolism research",
    headline: "Lower body weight and fat in obese mice",
    study: "A 2018 study blocked the NNMT enzyme in mice made obese by a high-fat diet and reported decreases in body weight and fat. It hasn't been tested in people. This compound is not a peptide.",
    evidence: "Animal study",
  },
  "aod-9604": {
    focus: "Fat-metabolism research",
    headline: "A growth-hormone fragment designed to target fat",
    study: "AOD-9604 is a modified fragment of growth hormone, developed in Australia as an obesity treatment and studied in fat-metabolism models. Early human trials didn't show clear enough weight loss for approval.",
    evidence: "Research review",
  },
  "ara-290": {
    focus: "Small-nerve-fiber research",
    headline: "More small nerve fibers in just 28 days",
    study: "In a 28-day randomized trial in people with sarcoidosis-related small-fiber neuropathy, ARA-290 increased the small nerve fibers seen in the cornea compared with placebo, and pain improved in every dose group.",
    evidence: "Human trial",
  },
  dsip: {
    focus: "Sleep & brain-signaling research",
    headline: "The sleep peptide researchers still call a riddle",
    study: "Decades of DSIP research have produced mixed results: some small studies reported better sleep, others found no effect. A 2006 review called it \"a still unresolved riddle\".",
    evidence: "Research review",
  },
  "igf-1-lr3": {
    focus: "Growth-factor signaling research",
    headline: "A long-acting form of growth factor IGF-1",
    study: "IGF-1 LR3 is a long-acting analogue of IGF-1 used in cell and growth-biology research. In a 2025 study in growth-restricted unborn lambs, it did not improve growth.",
    evidence: "Animal study",
  },
  kpv: {
    focus: "Gut inflammation research",
    headline: "Less gut inflammation in mice with colitis",
    study: "In a 2008 study, mice with colitis (inflamed bowels) that were given KPV by mouth had less inflammation. Gut cells took the peptide up directly. It hasn't been tested in human trials.",
    evidence: "Animal & cell study",
  },
  "nad-plus": {
    focus: "Cellular energy & aging research",
    headline: "NAD+ falls with age, and researchers are working to restore it",
    study: "A review explains how NAD+, a coenzyme every cell uses to make energy, declines with age and in some diseases, and how researchers are trying to raise it. Studies in people are small, with mixed results. It is not a peptide.",
    evidence: "Research review",
  },
  "pt-141": {
    focus: "Sexual-desire signaling research",
    headline: "More desire and less distress in two phase 3 trials",
    study: "The RECONNECT trials enrolled 1,267 premenopausal women with low sexual desire and related distress. Bremelanotide raised desire scores and lowered distress versus placebo; the gains were modest and apply to that clinical population.",
    evidence: "Human trials",
  },
  "ss-31": {
    focus: "Mitochondrial-function research",
    headline: "The first approved mitochondria-targeted medicine",
    study: "In a 168-week extension study of 10 people with Barth syndrome, a rare disease that weakens the heart and muscles, six-minute walking distance improved by 96 meters. The FDA granted it accelerated approval for Barth syndrome in 2025.",
    evidence: "Small open-label study",
    sourceIndex: 1,
  },
  glutathione: {
    focus: "Antioxidant & oxidative-stress research",
    headline: "The cell's main built-in antioxidant",
    study: "A 2004 review describes glutathione metabolism and its central role in protecting cells from oxidative stress.",
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
      headline: "Several studied peptides combined in one product",
      study: "This combination brings together ingredients investigated across complementary research pathways. Explore the individual product profiles for each material's research context.",
      evidence: "Ingredient research",
    }
  }
  if (handle === "bacteriostatic-water") {
    return {
      focus: "Laboratory preparation",
      headline: "Laboratory diluent for material preparation",
      study: "Used to prepare compatible laboratory materials. Consult its product details for composition and handling guidance.",
      evidence: "Laboratory supply",
    }
  }
  return {
    focus: "Research overview",
    headline: overview?.summary || "Explore this material and its documentation",
    study: overview?.findings[0] || overview?.sections.find(section => section.title === "How it works")?.text || "Open the product page to explore this material's research context and documentation.",
    evidence: "Research summary",
    source: overview?.sources[0],
  }
}
