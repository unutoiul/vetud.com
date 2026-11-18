import { getTranslations } from "next-intl/server"
import { getLearnIllustration } from "@/content/learn/illustrations"
import { WEIGHT_LOSS_TRIALS } from "@/content/learn/weight-loss-trials"
import PeptideExplorer, { type FeaturedGuide } from "./PeptideExplorer"

const weightStudies = [
  ["tirzepatide", "SURMOUNT-1"],
  ["semaglutide", "STEP 1"],
  ["retatrutide", "Phase 2"],
] as const

export default async function LearnHero() {
  const t = await getTranslations("LearnHero")
  const studies = weightStudies.map(([peptide, study]) => {
    const trial = WEIGHT_LOSS_TRIALS.find(item => item.peptide === peptide && item.trial === study)
    if (!trial) throw new Error(study + " is missing from WEIGHT_LOSS_TRIALS")
    return {
      peptide, name: trial.medicine, study: study === "Phase 2" ? t("phaseStudy") : study,
      change: -trial.medicineLoss, placebo: -trial.placeboLoss, weeks: trial.weeks, source: trial.source,
    }
  })
  const cagrilintide = WEIGHT_LOSS_TRIALS.find(trial => trial.medicine === "Cagrilintide" && trial.trial === "REDEFINE 1 (phase 3)")!
  const guides: FeaturedGuide[] = [...studies, {
    peptide: "tesamorelin" as const, name: "Tesamorelin", study: t("visceralStudy"),
    change: -15.2, placebo: 5.0, weeks: 26, source: "https://pubmed.ncbi.nlm.nih.gov/18057338/",
  }, {
    peptide: "liraglutide" as const, name: "Liraglutide", study: "SCALE",
    change: -8.0, placebo: -2.6, weeks: 56, source: "https://pubmed.ncbi.nlm.nih.gov/26132939/",
  }, {
    peptide: "cagrilintide" as const, name: cagrilintide.medicine, study: "REDEFINE 1",
    change: -cagrilintide.medicineLoss, placebo: -cagrilintide.placeboLoss, weeks: cagrilintide.weeks, source: cagrilintide.source,
  }, {
    peptide: "survodutide" as const, name: "Survodutide", study: t("phaseStudy"),
    change: -14.9, placebo: -2.8, weeks: 46, source: "https://pubmed.ncbi.nlm.nih.gov/38330987/",
  }, {
    peptide: "mazdutide" as const, name: "Mazdutide", study: "GLORY-1",
    change: -14.0, placebo: 0.3, weeks: 48, source: "https://doi.org/10.1056/NEJMoa2411528",
  }].map(item => ({
    ...item, cover: getLearnIllustration(item.peptide)!.src,
    topic: t(`features.${item.peptide}.topic`), deck: t(`features.${item.peptide}.deck`),
    result: t(`features.${item.peptide}.result`, { weeks: item.weeks }),
  }))

  return <PeptideExplorer guides={guides} />
}
