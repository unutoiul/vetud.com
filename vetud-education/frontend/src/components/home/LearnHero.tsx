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
  const guides: FeaturedGuide[] = [...studies, {
    peptide: "tesamorelin" as const, name: "Tesamorelin", study: t("visceralStudy"),
    change: -15.2, placebo: 5.0, weeks: 26, source: "https://pubmed.ncbi.nlm.nih.gov/18057338/",
  }].map(item => ({
    ...item, cover: getLearnIllustration(item.peptide)!.src,
    topic: t(`features.${item.peptide}.topic`), deck: t(`features.${item.peptide}.deck`),
    result: t(`features.${item.peptide}.result`, { weeks: item.weeks }),
  }))

  return <PeptideExplorer guides={guides} />
}
