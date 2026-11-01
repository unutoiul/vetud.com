import type { PeptideProfile } from "./peptides"
import { getVideos, type LearnVideo, type VideoConnection } from "./videos"

type Selection = {
  videos: LearnVideo[]
  specific: LearnVideo[]
  background: LearnVideo[]
  connections: Record<string, VideoConnection>
  introduction: string
}

// Direct matches discuss the compound, rather than merely its category.
const COMPOUND_VIDEOS: Record<string, string[]> = {
  semaglutide: ["IRS2xnO-y28", "o8YMLTfNYtc"], tirzepatide: ["IRS2xnO-y28"],
  retatrutide: ["ku8izA1Nh6o", "w0A_VRT3rIE"], cagrilintide: ["wbqcnfjETc4"],
  "bpc-157": ["Y6smr1o-f9o", "DhDC0DAYdBI"], kpv: ["DhDC0DAYdBI"], "tb-500": ["DhDC0DAYdBI"],
  ipamorelin: ["wDqrmuOOdBI"], "cjc-1295": ["E7MlK4p7O7c"], "aod-9604": ["E7MlK4p7O7c"],
  "thymosin-alpha-1": ["E7MlK4p7O7c"], "mots-c": ["DhDC0DAYdBI"],
  dsip: ["xXM5ecHxlMU"], semax: ["xXM5ecHxlMU"], epitalon: ["xXM5ecHxlMU"],
  "ghk-cu": ["TH_ZDyMzhqM"], melanotan: ["DWL46HWhmgQ"], nad: ["l8BI_720Dfs"],
  "pt-141": ["D58NZXJ3UeE"], kisspeptin: ["nMtSSCV1yvY", "wDqrmuOOdBI"],
  insulin: ["Gk1D4VgM8jY"], oxytocin: ["S933fvQGK1I"], octreotide: ["fYK29VEpMQw"],
  teriparatide: ["zTW_R-OqpZI"], hgh: ["Frck4v4YGV8", "_LKdNhF2WhI"],
}

const BACKGROUND: Record<PeptideProfile["category"], string[]> = {
  weight: ["KeqMSzFbSos", "pUWAgJKkOlg", "BBTqkHQjUzg"],
  skin: ["TH_ZDyMzhqM", "lJOQB_G15Jc"], pigmentation: ["DWL46HWhmgQ", "ixCGzGOlnGo"],
  hair: ["8diYLhl8bWU", "BBTqkHQjUzg"], recovery: ["O1N2rENXq_Y", "lJOQB_G15Jc"],
  energy: ["i1dAnpSFbyI", "l8BI_720Dfs"], growth: ["9dS7bc_2bUE", "Frck4v4YGV8", "_LKdNhF2WhI"],
  focus: ["FXYX_ksRwIk", "BBTqkHQjUzg"], calm: ["FXYX_ksRwIk", "ixCGzGOlnGo"],
  sleep: ["FXYX_ksRwIk", "lJOQB_G15Jc"], longevity: ["2wseM6wWd74", "ixCGzGOlnGo"],
  intimacy: ["ixCGzGOlnGo", "BBTqkHQjUzg"], fertility: ["9dS7bc_2bUE", "BBTqkHQjUzg"],
  immune: ["O1N2rENXq_Y", "BBTqkHQjUzg"], medicines: ["9dS7bc_2bUE", "lJOQB_G15Jc"],
}

const CONTEXT: Record<string, string> = {
  wDqrmuOOdBI: "Historical FDA discussion from October 2024. Kisspeptin-10 and ipamorelin are covered; other forms and later decisions may differ.",
  E7MlK4p7O7c: "Historical FDA discussion of CJC-1295, AOD-9604 and thymosin alpha-1. An advisory meeting is not approval or evidence of clinical benefit.",
  DhDC0DAYdBI: "The original July 23, 2026 FDA discussion of BPC-157, KPV, TB-500 and MOTS-c; it documents an advisory review.",
  xXM5ecHxlMU: "The original July 24, 2026 FDA discussion of DSIP, Semax and Epitalon; it documents an advisory review.",
  Frck4v4YGV8: "Explains diagnosed growth hormone deficiency. This is different from claims about anti-ageing or unapproved growth-hormone-releasing compounds.",
  fYK29VEpMQw: "Discusses octreotide in childhood hyperinsulinism. This specialist clinical example does not cover all the drug’s indications.",
  "zTW_R-OqpZI": "Education about prescribed teriparatide from a patient and nurse. It concerns licensed osteoporosis medicines.",
  nMtSSCV1yvY: "The researchers describe an exploratory kisspeptin brain-imaging study. This is not proof of a general treatment benefit.",
  wbqcnfjETc4: "Discusses semaglutide plus cagrilintide and earlier results. Our source links cover the later head-to-head trial.",
}

function backgroundReason(video: LearnVideo, name: string) {
  if (video.topic === "research") return `Helps you judge the study design or uncertainty in ${name} research; it is not a trial of the compound.`
  const subjects: Record<string, string> = {
    "9dS7bc_2bUE": "hypothalamus and pituitary signalling", "_LKdNhF2WhI": "growth hormone physiology",
    FXYX_ksRwIk: "neurotransmitter biology", i1dAnpSFbyI: "mitochondria and cellular energy",
    l8BI_720Dfs: "NAD metabolism", "2wseM6wWd74": "telomeres and cellular ageing",
    "8diYLhl8bWU": "hair-follicle biology", O1N2rENXq_Y: "immune cells and inflammation",
    TH_ZDyMzhqM: "topical copper-peptide skincare", gNFDONSjB7Q: "programmed cell death",
    KeqMSzFbSos: "GLP-1 signalling", pUWAgJKkOlg: "weight maintenance after GLP-1 treatment",
  }
  return `Background on ${subjects[video.id] ?? "related biology"} for understanding ${name}. It does not demonstrate benefits of this compound or formulation.`
}

function select(specificIds: string[], backgroundIds: string[], name: string, introduction: string): Selection {
  const specific = getVideos([...new Set(specificIds)]).slice(0, 2)
  const background = getVideos([...new Set(backgroundIds)].filter(id => !specific.some(video => video.id === id))).slice(0, 3 - specific.length)
  const videos = [...specific, ...background]
  const connections: Record<string, VideoConnection> = {}
  for (const video of specific) connections[video.id] = {
    label: video.topic === "regulation" ? "Official regulatory recording" : "Discusses the compound",
    explanation: CONTEXT[video.id] ?? `Discusses ${name} or its clinical context. Read the original studies linked here for the exact formulation, population and outcomes.`,
  }
  for (const video of background) connections[video.id] = { label: video.topic === "regulation" ? "Regulatory context" : video.topic === "research" ? "Research skills" : "Related biology", explanation: CONTEXT[video.id] ?? backgroundReason(video, name) }
  return { videos, specific, background, connections, introduction }
}

export function getProfileVideoResources(peptide: PeptideProfile): Selection {
  const direct = COMPOUND_VIDEOS[peptide.slug] ?? []
  const background = peptide.slug === "cbl-514" ? ["gNFDONSjB7Q", "pUWAgJKkOlg", "BBTqkHQjUzg"]
    : peptide.slug === "ptt-a" ? ["KeqMSzFbSos", "lJOQB_G15Jc", "BBTqkHQjUzg"]
    : BACKGROUND[peptide.category]
  return select(direct, background, peptide.name, direct.length
    ? "Start with the compound discussion, then use the background lesson to understand its biology. Each card explains its connection. Recordings may predate later findings or regulatory changes."
    : `We have not selected a reliable dedicated ${peptide.name} video. These lessons cover the relevant biology and research methods; the compound-specific evidence is in the sources below.`)
}

const ARTICLE_SELECTIONS: Record<string, { specific: string[]; background: string[]; context: string }> = {
  "ptt-a-four-receptors-animal-evidence": { specific: [], background: ["KeqMSzFbSos", "lJOQB_G15Jc", "BBTqkHQjUzg"], context: "These lessons explain one of PTT-A’s proposed pathways and how studies in people differ from preclinical work. None is a PTT-A human trial." },
  "rlx-201-skin-serum-12-weeks": { specific: [], background: ["2wseM6wWd74", "lJOQB_G15Jc", "TH_ZDyMzhqM"], context: "Background on cellular ageing, clinical research and a different skincare ingredient. These videos do not test RLX-201, and copper peptides are not the TORC1 inhibitor studied in the article." },
  "cbl-514-fat-cells-self-destruct": { specific: [], background: ["gNFDONSjB7Q", "pUWAgJKkOlg", "BBTqkHQjUzg"], context: "Learn what apoptosis means, why weight regain is studied, and how to read a human study. These videos are background; they do not establish that CBL-514 prevents weight regain in people." },
  "fda-advisers-review-bpc-157-and-six-peptides": { specific: ["DhDC0DAYdBI", "xXM5ecHxlMU"], background: ["ixCGzGOlnGo"], context: "Watch the original meetings discussed in the article. The research lesson helps distinguish a regulatory discussion from a clinical safety or effectiveness result." },
  "fda-category-2-twelve-peptides": { specific: [], background: ["E7MlK4p7O7c", "DhDC0DAYdBI", "xXM5ecHxlMU"], context: "These official meetings provide regulatory context for several compounds named in the article. They are historical recordings, not announcements that the compounds were approved." },
  "retatrutide-triumph-2-and-3": { specific: ["ku8izA1Nh6o", "w0A_VRT3rIE"], background: ["BBTqkHQjUzg"], context: "Physician explanations of retatrutide, paired with a research-methods lesson. The article’s original sources identify the exact TRIUMPH-2 and TRIUMPH-3 results." },
  "retatrutide-triumph-1-28-percent": { specific: ["ku8izA1Nh6o", "w0A_VRT3rIE"], background: ["KeqMSzFbSos"], context: "Follow the development of retatrutide alongside background on GLP-1 signalling. Videos may cover a different trial phase; use the source links for the TRIUMPH-1 figures." },
  "cagrisema-vs-zepbound": { specific: ["wbqcnfjETc4", "IRS2xnO-y28"], background: ["BBTqkHQjUzg"], context: "Understand the CagriSema combination and the semaglutide/tirzepatide names. The earlier CagriSema explainer is not a report of the later REDEFINE 4 head-to-head result." },
  "wegovy-pill-approved": { specific: ["IRS2xnO-y28", "o8YMLTfNYtc"], background: ["lJOQB_G15Jc"], context: "Semaglutide and GLP-1 background, plus how clinical research is assessed. These recordings do not establish equivalence between tablets, injections or laboratory materials; OASIS 4 is linked below." },
  "from-cells-to-human-trials": { specific: [], background: ["lJOQB_G15Jc", "BBTqkHQjUzg", "y7BCOolGVcM"], context: "NIH explainers to accompany the guide: what research is, the questions different studies ask, and informed consent." },
  "body-weight-fat-and-muscle-results": { specific: [], background: ["BBTqkHQjUzg", "pUWAgJKkOlg", "lJOQB_G15Jc"], context: "Use these lessons to identify the question a study asked and to separate a measured result from a broader treatment claim." },
}

export function getArticleVideoResources(slug: string, peptides: PeptideProfile[]): Selection {
  const choice = ARTICLE_SELECTIONS[slug]
  const name = peptides.map(peptide => peptide.name).slice(0, 3).join(", ") || "this topic"
  if (choice) return select(choice.specific, choice.background, name, choice.context)
  // Without a hand-picked selection, use the compound videos and topic lessons of the article's peptides.
  const direct = peptides.flatMap((peptide) => COMPOUND_VIDEOS[peptide.slug] ?? [])
  const background = [...(peptides[0] ? BACKGROUND[peptides[0].category] : []), "lJOQB_G15Jc", "BBTqkHQjUzg"]
  return select(direct, background, name, direct.length
    ? "Videos discussing the compounds in this article, plus background on the biology or the research methods. Each card explains its connection; recordings may predate the findings described here."
    : "Related lessons on the biology and on understanding the evidence in this article. None of them is a trial of the compound.")
}

/** Simple list for source audits and other consumers. */
export function getArticleVideos(slug: string, peptides: PeptideProfile[]) {
  return getArticleVideoResources(slug, peptides).videos
}
