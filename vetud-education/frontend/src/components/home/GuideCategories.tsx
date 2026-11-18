import { getTranslations } from "next-intl/server"
import { CATEGORIES, type CategoryId } from "@/content/learn/categories"
import { getLearnIllustration } from "@/content/learn/illustrations"
import { PEPTIDES } from "@/content/learn/peptides"
import { translateAction } from "@/i18n/actions"
import CategoryCarousel from "./CategoryCarousel"

const artwork: Record<CategoryId, string> = {
  weight: "mazdutide", skin: "matrixyl", pigmentation: "melanotan", hair: "ahk-cu",
  recovery: "bpc-157", energy: "ss-31", growth: "peg-mgf", focus: "dihexa",
  calm: "selank", sleep: "dsip", longevity: "foxo4-dri", intimacy: "pt-141",
  fertility: "gonadorelin", immune: "thymalin", medicines: "pramlintide",
}

export default async function GuideCategories() {
  const [actions, t] = await Promise.all([getTranslations("Actions"), getTranslations("LearnHero")])
  const categories = CATEGORIES.map(({ id, name }) => ({
    id, name: translateAction(actions, name), cover: getLearnIllustration(artwork[id])!.src,
    count: t("guideCount", { count: PEPTIDES.filter(guide => guide.category === id).length }),
  }))
  return <CategoryCarousel categories={categories} />
}
