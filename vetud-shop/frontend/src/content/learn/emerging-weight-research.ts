/** Original research and sponsor records, with the evidence level retained. */
export const PTT_A_SOURCES = [
  { title: "PTT-A tetra-agonist compared with tirzepatide in diet-induced obese rats (85-OR)", detail: "Ghosh et al. · Diabetes · ADA conference abstract · 2025", url: "https://doi.org/10.2337/db25-85-OR" },
  { title: "Discovery of long-acting peptide tetra-agonists in animal models of obesity (299-OR)", detail: "Diabetes · ADA conference abstract · 2024", url: "https://doi.org/10.2337/db24-299-OR" },
  { title: "Versant Ventures unveils Pep2Tango Therapeutics", detail: "Original company launch announcement · November 21, 2024 (PDF)", url: "https://www.versantventures.com/system/uploads/fae/file/asset/113/Versant_Ventures_Unveils_Pep2Tango_Therapeutics_Inc.___Business_Wire.pdf" },
]

export const CBL_514_SOURCES = [
  { title: "Efficacy and safety of CBL-514 injection in reducing abdominal subcutaneous fat", detail: "Gold et al. · Aesthetic Surgery Journal · randomized phase 2 study · 2025", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12080885/" },
  { title: "CBL-514: visceral-fat subgroup and weight-regain research at EASD 2026", detail: "EASD press-room report reproduced by Caliway · preliminary conference findings · October 2, 2026", url: "https://www.caliwaybiopharma.com/en/news-detail/-CBL-514-EASD-2026-subcutaneousfat-visceralfat-reduction-study-ENG/" },
]

/** These are deliberately outside the numeric human body-weight trial dataset. */
export const EMERGING_WEIGHT_RESEARCH = [
  {
    peptide: "ptt-a", name: "PTT-A", evidence: "Animal research · conference abstract",
    measured: "Body weight in diet-induced obese rats over 21 days",
    finding: "Body weight was 19.2% lower versus vehicle at the higher studied exposure; tirzepatide was 12.1% lower versus vehicle in the same experiment.",
    humanWeightLoss: "Not established in the cited research",
    limitation: "A difference versus vehicle in rats is not average weight lost by people. It cannot establish superiority to retatrutide in humans.",
    article: "ptt-a-four-receptors-animal-evidence", source: PTT_A_SOURCES[0], sourceLabel: "ADA conference abstract",
  },
  {
    peptide: "cbl-514", name: "CBL-514", evidence: "Human fat-volume subgroup · conference report",
    measured: "MRI-measured visceral-fat volume, four weeks after final treatment",
    finding: "Visceral-fat volume fell 12.01%; placebo rose 5.68%. The small phase 2 subgroup had 40 participants with later follow-up data.",
    humanWeightLoss: "Not established by this fat-volume result",
    limitation: "12.01% less visceral fat is not 12.01% less body weight. CBL-514 is an experimental small molecule, not a peptide.",
    article: "cbl-514-fat-cells-self-destruct", source: CBL_514_SOURCES[1], sourceLabel: "EASD conference report",
  },
]
