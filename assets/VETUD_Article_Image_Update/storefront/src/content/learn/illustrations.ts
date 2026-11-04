/** VETUD editorial artwork. Conceptual illustrations, not chemical structure diagrams. */
export type LearnIllustration = { src: string; alt: string }

const ILLUSTRATIONS: Record<string, LearnIllustration> = {
  "ptt-a": {
    "src": "/images/learn/illustrations/vetud-learn-ptt-a.webp",
    "alt": "Conceptual illustration of PTT-A: four hormone signals under investigation."
  },
  "semaglutide": {
    "src": "/images/learn/illustrations/vetud-learn-semaglutide.webp",
    "alt": "Conceptual illustration of Semaglutide: gut and brain signalling related to fullness."
  },
  "cbl-514": {
    "src": "/images/learn/illustrations/vetud-learn-cbl-514.webp",
    "alt": "Conceptual illustration of CBL-514: research into targeted fat-cell removal."
  },
  "tirzepatide": {
    "src": "/images/learn/illustrations/vetud-learn-tirzepatide.webp",
    "alt": "Conceptual illustration of Tirzepatide: two gut-hormone signals."
  },
  "retatrutide": {
    "src": "/images/learn/illustrations/vetud-learn-retatrutide.webp",
    "alt": "Conceptual illustration of Retatrutide: appetite and energy-use research."
  },
  "liraglutide": {
    "src": "/images/learn/illustrations/vetud-learn-liraglutide.webp",
    "alt": "Conceptual illustration of Liraglutide: understanding the fullness signal."
  },
  "cagrilintide": {
    "src": "/images/learn/illustrations/vetud-learn-cagrilintide.webp",
    "alt": "Conceptual illustration of Cagrilintide: amylin and the feeling of fullness."
  },
  "aod-9604": {
    "src": "/images/learn/illustrations/vetud-learn-aod-9604.webp",
    "alt": "Conceptual illustration of AOD-9604: growth-hormone fragment and fat metabolism research."
  },
  "argireline": {
    "src": "/images/learn/illustrations/vetud-learn-argireline.webp",
    "alt": "Conceptual illustration of Argireline and SNAP-8: cosmetic peptides and expression lines."
  },
  "ghk-cu": {
    "src": "/images/learn/illustrations/vetud-learn-ghk-cu.webp",
    "alt": "Conceptual illustration of GHK-Cu: copper peptides and skin research."
  },
  "melanotan": {
    "src": "/images/learn/illustrations/vetud-learn-melanotan.webp",
    "alt": "Conceptual illustration of Melanotan I and II: understanding skin pigmentation."
  },
  "bpc-157": {
    "src": "/images/learn/illustrations/vetud-learn-bpc-157.webp",
    "alt": "Conceptual illustration of BPC-157: tissue-repair research."
  },
  "tb-500": {
    "src": "/images/learn/illustrations/vetud-learn-tb-500.webp",
    "alt": "Conceptual illustration of TB-500: cell movement and tissue-repair research."
  },
  "kpv": {
    "src": "/images/learn/illustrations/vetud-learn-kpv.webp",
    "alt": "Conceptual illustration of KPV: research into inflammation in the gut."
  },
  "ara-290": {
    "src": "/images/learn/illustrations/vetud-learn-ara-290.webp",
    "alt": "Conceptual illustration of ARA-290: small nerve fibres under investigation."
  },
  "mots-c": {
    "src": "/images/learn/illustrations/vetud-learn-mots-c.webp",
    "alt": "Conceptual illustration of MOTS-c: mitochondrial signals and metabolism."
  },
  "nad": {
    "src": "/images/learn/illustrations/vetud-learn-nad.webp",
    "alt": "Conceptual illustration of NAD+: a helper molecule for cellular energy."
  },
  "ss-31": {
    "src": "/images/learn/illustrations/vetud-learn-ss-31.webp",
    "alt": "Conceptual illustration of SS-31: working at the mitochondrial membrane."
  },
  "slu-pp-332": {
    "src": "/images/learn/illustrations/vetud-learn-slu-pp-332.webp",
    "alt": "Conceptual illustration of SLU-PP-332: exercise-pathway research in mice."
  },
  "5-amino-1mq": {
    "src": "/images/learn/illustrations/vetud-learn-5-amino-1mq.webp",
    "alt": "Conceptual illustration of 5-Amino-1MQ: nnmt and fat-cell metabolism research."
  },
  "ipamorelin": {
    "src": "/images/learn/illustrations/vetud-learn-ipamorelin.webp",
    "alt": "Conceptual illustration of Ipamorelin: research into growth-hormone release."
  },
  "tesamorelin": {
    "src": "/images/learn/illustrations/vetud-learn-tesamorelin.webp",
    "alt": "Conceptual illustration of Tesamorelin: understanding visceral-fat research."
  },
  "sermorelin": {
    "src": "/images/learn/illustrations/vetud-learn-sermorelin.webp",
    "alt": "Conceptual illustration of Sermorelin: growth-hormone signalling research."
  },
  "cjc-1295": {
    "src": "/images/learn/illustrations/vetud-learn-cjc-1295.webp",
    "alt": "Conceptual illustration of CJC-1295: a longer-lasting growth-hormone signal."
  },
  "semax": {
    "src": "/images/learn/illustrations/vetud-learn-semax.webp",
    "alt": "Conceptual illustration of Semax: brain-signalling research."
  },
  "hgh": {
    "src": "/images/learn/illustrations/vetud-learn-hgh.webp",
    "alt": "Conceptual illustration of Human growth hormone: the body’s growth-hormone system."
  },
  "igf-1-lr3": {
    "src": "/images/learn/illustrations/vetud-learn-igf-1-lr3.webp",
    "alt": "Conceptual illustration of IGF-1 LR3: growth signals studied in the laboratory."
  },
  "selank": {
    "src": "/images/learn/illustrations/vetud-learn-selank.webp",
    "alt": "Conceptual illustration of Selank: anxiety-related signalling research."
  },
  "dsip": {
    "src": "/images/learn/illustrations/vetud-learn-dsip.webp",
    "alt": "Conceptual illustration of DSIP: the unresolved science of sleep."
  },
  "epitalon": {
    "src": "/images/learn/illustrations/vetud-learn-epitalon.webp",
    "alt": "Conceptual illustration of Epitalon: telomeres under the microscope."
  },
  "pt-141": {
    "src": "/images/learn/illustrations/vetud-learn-pt-141.webp",
    "alt": "Conceptual illustration of PT-141: research into desire signalling."
  },
  "hcg": {
    "src": "/images/learn/illustrations/vetud-learn-hcg.webp",
    "alt": "Conceptual illustration of hCG: the hormone signal used in fertility care."
  },
  "kisspeptin": {
    "src": "/images/learn/illustrations/vetud-learn-kisspeptin.webp",
    "alt": "Conceptual illustration of Kisspeptin: research into reproductive signalling."
  },
  "fsh": {
    "src": "/images/learn/illustrations/vetud-learn-fsh.webp",
    "alt": "Conceptual illustration of FSH: follicle development in fertility care."
  },
  "thymosin-alpha-1": {
    "src": "/images/learn/illustrations/vetud-learn-thymosin-alpha-1.webp",
    "alt": "Conceptual illustration of Thymosin alpha-1: understanding immune-cell signalling."
  },
  "vip": {
    "src": "/images/learn/illustrations/vetud-learn-vip.webp",
    "alt": "Conceptual illustration of VIP: blood vessels, lungs and signalling research."
  },
  "insulin": {
    "src": "/images/learn/illustrations/vetud-learn-insulin.webp",
    "alt": "Conceptual illustration of Insulin: glucose entering muscle and fat cells."
  },
  "oxytocin": {
    "src": "/images/learn/illustrations/vetud-learn-oxytocin.webp",
    "alt": "Conceptual illustration of Oxytocin: a hormone central to childbirth."
  },
  "octreotide": {
    "src": "/images/learn/illustrations/vetud-learn-octreotide.webp",
    "alt": "Conceptual illustration of Octreotide: a brake on excess hormone signals."
  },
  "rlx-201": {
    "src": "/images/learn/illustrations/vetud-learn-rlx-201.webp",
    "alt": "Conceptual illustration of RLX-201: skin firmness and cell-signalling research."
  },
  "teriparatide": {
    "src": "/images/learn/illustrations/vetud-learn-teriparatide.webp",
    "alt": "Conceptual illustration of Teriparatide: supporting bone-building cells."
  },
  "ahk-cu": {
    "src": "/images/learn/illustrations/vetud-learn-ahk-cu.webp",
    "alt": "Conceptual illustration of AHK-Cu: copper-peptide hair-follicle research."
  }
}

const ARTICLE_IMAGES: Record<string, string> = {
  "ptt-a-four-receptors-animal-evidence": "ptt-a",
  "cbl-514-fat-cells-self-destruct": "cbl-514",
  "rlx-201-skin-serum-12-weeks": "rlx-201",
  "retatrutide-triumph-2-and-3": "retatrutide",
  "retatrutide-triumph-1-28-percent": "retatrutide",
  "wegovy-pill-approved": "semaglutide",
  "bpc-157-human-evidence": "bpc-157",
  "peptide-blends-bpc-157-tb-500-ghk-cu": "bpc-157",
  "tesamorelin-visceral-and-liver-fat": "tesamorelin",
  "growth-hormone-releasers-what-human-studies-tested": "cjc-1295",
  "growth-hormone-healthy-older-adults": "hgh",
  "aod-9604-growth-hormone-fragment": "aod-9604",
  "semax-selank-russian-nasal-peptides": "semax",
  "epitalon-telomeres-cell-study": "epitalon",
  "melanotan-tanning-injections-risks": "melanotan",
  "bremelanotide-desire-trials": "pt-141",
  "kisspeptin-ivf-trigger-ohss": "kisspeptin",
  "thymosin-alpha-1-sepsis-tests-trial": "thymosin-alpha-1",
  "elamipretide-first-mitochondrial-medicine": "ss-31",
  "exercise-pills-slu-pp-332-5-amino-1mq-mice": "slu-pp-332",
  "copper-peptides-hair-growth": "ahk-cu",
  "ara-290-cibinetide-small-nerve-fibers": "ara-290",
  "dsip-sleep-peptide-riddle": "dsip",
  "cagrisema-vs-zepbound": "cagrilintide"
}

export function getLearnIllustration(slug: string): LearnIllustration | undefined {
  return ILLUSTRATIONS[ARTICLE_IMAGES[slug] ?? slug]
}
