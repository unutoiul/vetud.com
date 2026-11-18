"use client"

import { useId, useState } from "react"
import Image from "next/image"
import { useFormatter, useTranslations } from "next-intl"
import { LazyMotion, domAnimation, useReducedMotion } from "motion/react"
import * as m from "motion/react-m"
import Icon from "../brand/Icon"
import { LocalizedNextLink } from "../common/links"
import styles from "./LearnHero.module.css"

export type FeaturedGuide = {
  peptide: string
  name: string
  study: string
  change: number
  placebo: number
  source: string
  cover: string
  topic: string
  deck: string
  result: string
}

export default function PeptideExplorer({ guides }: { guides: FeaturedGuide[] }) {
  const [index, setIndex] = useState(0)
  const [hasSwitched, setHasSwitched] = useState(false)
  const reduceMotion = useReducedMotion()
  const t = useTranslations("LearnHero")
  const format = useFormatter()
  const titleId = useId()
  const resultId = useId()
  const guide = guides[index]
  const percent = (value: number) => format.number(value / 100, {
    style: "percent", signDisplay: "always", minimumFractionDigits: 1, maximumFractionDigits: 1,
  }).replace("-", "−")
  const animateSelection = hasSwitched && !reduceMotion

  return (
    <LazyMotion features={domAnimation}>
      <section className={styles.feature} aria-labelledby={titleId}>
        <div className={styles.layout}>
          <header className={styles.header}>
            <p className={styles.kicker}><span aria-hidden="true" />{t("series")}</p>
            <m.h1 key={guide.peptide} id={titleId} className={styles.title}
              initial={animateSelection ? { opacity: 0.4, y: 9 } : false}
              animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36 }}>
              {guide.name}
            </m.h1>
          </header>
          <div className={styles.art} aria-hidden="true">
            <m.div className={styles.artLayer} key={guide.peptide}
              initial={animateSelection ? { scale: 1.07, rotate: -2, opacity: 0.45 } : false}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
              <Image src={`/images/learn/spotlights/${guide.peptide}.webp`} alt="" fill
                sizes="(min-width: 1480px) 810px, (min-width: 701px) 56vw, 100vw"
                preload={!hasSwitched} loading={hasSwitched ? "eager" : undefined}
                className={hasSwitched ? styles.sculpture : styles.arrival} />
            </m.div>
          </div>
          <div className={styles.selector} role="group" aria-label={t("featured")}>
            {guides.map((item, i) => (
              <button key={item.peptide} type="button" aria-pressed={index === i} aria-controls={`${titleId} ${resultId}`}
                onClick={() => { if (i !== index) { setHasSwitched(true); setIndex(i) } }}>
                <span className={styles.thumb}>
                  <Image src={item.cover} alt="" fill sizes="72px" />
                </span>
                <span className={styles.tabText}>
                  <strong>{item.name}</strong><small>{item.topic}</small>
                </span>
              </button>
            ))}
          </div>
          <div className={styles.copy} id={resultId} aria-live="polite" aria-atomic="true">
            <p className={styles.deck}>{guide.deck}</p>
            <div className={styles.result}>
              <strong>{percent(guide.change)}</strong>
              <div><p>{guide.result}</p>
                <a href={guide.source} target="_blank" rel="noopener noreferrer">
                  {guide.study}<Icon name="arrowUpRight" />
                </a>
                <span className={styles.placebo}>{t("placeboChange", { change: percent(guide.placebo) })}</span>
              </div>
            </div>
            <div className={styles.actions}>
              <LocalizedNextLink href={`/learn/${guide.peptide}`} aria-label={t("readGuide", { name: guide.name })}>
                {t("openGuide")}<Icon name="arrowRight" />
              </LocalizedNextLink>
              <LocalizedNextLink href="/learn">{t("allGuides")}</LocalizedNextLink>
            </div>
          </div>
        </div>
      </section>
    </LazyMotion>
  )
}
