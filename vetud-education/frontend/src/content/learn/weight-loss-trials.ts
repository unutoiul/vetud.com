/**
 * Average body weight lost in the main published trials of each medicine (peer-reviewed only;
 * numbers from the abstracts or full journal reports). Company topline results stay out of the chart.
 */
export type WeightLossTrial = {
  medicine: string
  dose: string
  status: string
  trial: string
  people: number
  weeks: number
  medicineLoss: number
  placeboLoss: number
  peptide: string
  source: string
}

export const WEIGHT_LOSS_TRIALS: WeightLossTrial[] = [
  { medicine: "Retatrutide", dose: "12 mg weekly", status: "Experimental", trial: "Phase 2", people: 338, weeks: 48, medicineLoss: 24.2, placeboLoss: 2.1, peptide: "retatrutide", source: "https://pubmed.ncbi.nlm.nih.gov/37366315/" },
  { medicine: "Tirzepatide", dose: "15 mg weekly (Zepbound)", status: "Approved", trial: "SURMOUNT-1", people: 2539, weeks: 72, medicineLoss: 20.9, placeboLoss: 3.1, peptide: "tirzepatide", source: "https://pubmed.ncbi.nlm.nih.gov/35658024/" },
  // REDEFINE 1, Figure 1A: treatment-policy estimates, not the trial-product estimates in Figure 1B.
  // Both REDEFINE 1 rows share the placebo arm; people is the total randomized trial population.
  { medicine: "CagriSema", dose: "Cagrilintide 2.4 mg + semaglutide 2.4 mg weekly", status: "Experimental", trial: "REDEFINE 1 (phase 3)", people: 3417, weeks: 68, medicineLoss: 20.4, placeboLoss: 3.0, peptide: "cagrilintide", source: "https://pubmed.ncbi.nlm.nih.gov/40544433/" },
  { medicine: "Semaglutide", dose: "2.4 mg weekly injection (Wegovy)", status: "Approved", trial: "STEP 1", people: 1961, weeks: 68, medicineLoss: 14.9, placeboLoss: 2.4, peptide: "semaglutide", source: "https://pubmed.ncbi.nlm.nih.gov/33567185/" },
  { medicine: "Semaglutide", dose: "25 mg daily pill (Wegovy pill)", status: "Approved (US)", trial: "OASIS 4", people: 307, weeks: 64, medicineLoss: 13.6, placeboLoss: 2.2, peptide: "semaglutide", source: "https://pubmed.ncbi.nlm.nih.gov/40934115/" },
  { medicine: "Cagrilintide", dose: "2.4 mg weekly, studied alone", status: "Experimental", trial: "REDEFINE 1 (phase 3)", people: 3417, weeks: 68, medicineLoss: 11.5, placeboLoss: 3.0, peptide: "cagrilintide", source: "https://pubmed.ncbi.nlm.nih.gov/40544433/" },
]
