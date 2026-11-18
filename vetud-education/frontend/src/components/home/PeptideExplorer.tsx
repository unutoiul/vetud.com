"use client"

import { useId, useRef, useState, type KeyboardEvent } from "react"
import Image from "next/image"
import { useFormatter, useTranslations } from "next-intl"
import { LazyMotion, domAnimation, useReducedMotion } from "motion/react"
import * as m from "motion/react-m"
import Icon from "../brand/Icon"
import { LocalizedNextLink } from "../common/links"
import styles from "./LearnHero.module.css"
import CarouselArrows from "./CarouselArrows"

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
  const rail = useRef<HTMLDivElement>(null)
  const touchStart = useRef<{ id: number; x: number; y: number } | null>(null)
  const guide = guides[index]
  const percent = (value: number) => format.number(value / 100, {
    style: "percent", signDisplay: "always", minimumFractionDigits: 1, maximumFractionDigits: 1,
  }).replace("-", "−")
  const animateSelection = hasSwitched && !reduceMotion

  function select(position: number, focus = false) {
    const next = (position + guides.length) % guides.length
    const strip = rail.current
    const card = strip?.children[next] as HTMLButtonElement | undefined
    if (next !== index) {
      setHasSwitched(true)
      setIndex(next)
    }
    if (!strip || !card) return
    if (focus) card.focus({ preventScroll: true })
    strip.scrollTo({ left: card.offsetLeft - (strip.clientWidth - card.offsetWidth) / 2, behavior: reduceMotion ? "instant" : "smooth" })
  }

  function onPickerKey(event: KeyboardEvent<HTMLDivElement>) {
    const targets: Record<string, number> = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: guides.length - 1 }
    if (event.key in targets) {
      event.preventDefault()
      select(targets[event.key], true)
    }
  }

  return (
    <LazyMotion features={domAnimation}>
      <section className={styles.feature} aria-label={t("featuredGuides")} aria-roledescription={t("carousel")}>
        <div className={styles.layout}>
          <header className={styles.header}>
            <p className={styles.kicker}><span aria-hidden="true" />{t("series")}</p>
            <m.h1 key={guide.peptide} id={titleId} className={styles.title}
              initial={animateSelection ? { opacity: 0.4, y: 9 } : false}
              animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36 }}>
              {guide.name}
            </m.h1>
          </header>
          <div className={styles.art} aria-hidden="true"
            onPointerDown={event => {
              if (event.pointerType !== "touch" || !event.isPrimary) return
              touchStart.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerCancel={() => { touchStart.current = null }}
            onPointerUp={event => {
              const start = touchStart.current
              touchStart.current = null
              if (!start || event.pointerId !== start.id) return
              const dx = event.clientX - start.x
              if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(event.clientY - start.y) * 1.4) select(index + (dx < 0 ? 1 : -1))
            }}>
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
              <LocalizedNextLink href={`/learn/${guide.peptide}`} aria-label={t("readNamedGuide", { name: guide.name })}>
                {t("openGuide")}<Icon name="arrowRight" />
              </LocalizedNextLink>
              <LocalizedNextLink href="/learn">{t("allGuides")}</LocalizedNextLink>
            </div>
          </div>
          <div className={styles.navigation}>
            <div className={styles.selector} ref={rail} role="group" aria-label={t("featured")} onKeyDown={onPickerKey}>
              {guides.map((item, i) => (
                <button key={item.peptide} type="button" aria-pressed={index === i} tabIndex={index === i ? 0 : -1}
                  aria-controls={`${titleId} ${resultId}`} onClick={() => select(i)}>
                  <span className={styles.thumb}><Image src={item.cover} alt="" fill sizes="72px" /></span>
                  <span className={styles.tabText}><strong>{item.name}</strong><small>{item.topic}</small></span>
                </button>
              ))}
            </div>
            <div className={styles.controls}>
              <span aria-label={t("guidePosition", { current: index + 1, total: guides.length })} className={styles.count}>
                {String(index + 1).padStart(2, "0")} <span>/ {String(guides.length).padStart(2, "0")}</span>
              </span>
              <div className={styles.meter} aria-hidden="true"><i style={{ transform: `scaleX(${(index + 1) / guides.length})` }} /></div>
              <CarouselArrows controls={`${titleId} ${resultId}`} previousLabel={t("previousGuide")} nextLabel={t("nextGuide")}
                previous={() => select(index - 1)} next={() => select(index + 1)} />
            </div>
          </div>
        </div>
      </section>
    </LazyMotion>
  )
}
