"use client"

import Image from "next/image"
import { useTranslations } from "next-intl"
import { useEffect, useId, useRef, useState } from "react"
import Icon from "../brand/Icon"
import { LocalizedNextLink } from "../common/links"
import CarouselArrows from "./CarouselArrows"
import styles from "./CategoryCarousel.module.css"

type Category = { id: string; name: string; cover: string; count: string }

export default function CategoryCarousel({ categories }: { categories: Category[] }) {
  const t = useTranslations("LearnHero")
  const id = useId()
  const rail = useRef<HTMLUListElement>(null)
  const [position, setPosition] = useState({ progress: 0, visible: 0 })

  function measure() {
    const list = rail.current
    if (!list || !list.scrollWidth) return
    const range = list.scrollWidth - list.clientWidth
    setPosition({
      progress: range <= 1 ? 0 : range - list.scrollLeft <= 1 ? 1 : Math.max(0, list.scrollLeft / range),
      visible: list.clientWidth / list.scrollWidth,
    })
  }

  useEffect(() => {
    const list = rail.current
    if (!list) return
    const observer = new ResizeObserver(measure)
    observer.observe(list)
    return () => observer.disconnect()
  }, [])

  function move(direction: number) {
    const list = rail.current
    if (!list || list.children.length < 2) return
    const cards = list.children as HTMLCollectionOf<HTMLLIElement>
    const stride = cards[1].offsetLeft - cards[0].offsetLeft
    const visible = Math.max(1, Math.floor((list.clientWidth + 1) / stride))
    const first = Math.round(list.scrollLeft / stride)
    list.scrollTo({ left: (first + direction * visible) * stride, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })
  }

  return <section className={styles.section} aria-labelledby={id + "-heading"}>
    <div className={styles.inner}>
      <header className={styles.heading}>
        <h2 id={id + "-heading"}>{t("categoryTitle")}</h2>
        <LocalizedNextLink href="/learn">{t("allGuides")} <Icon name="arrowUpRight" /></LocalizedNextLink>
      </header>
      <ul id={id} ref={rail} className={styles.rail} onScroll={measure}>
        {categories.map(category =>
          <li key={category.id}>
            <LocalizedNextLink href={`/learn#${category.id}`} className={styles.card}>
              <span className={styles.picture} data-topic={category.id}>
                <Image src={category.cover} alt="" fill sizes="(max-width: 700px) 75vw, (max-width: 1024px) 32vw, 330px" />
              </span>
              <span className={styles.caption}>
                <small>{category.count}</small>
                <strong>{category.name}</strong>
                <Icon name="arrowUpRight" />
              </span>
            </LocalizedNextLink>
          </li>
        )}
      </ul>
      <div className={styles.footer}>
        <div className={styles.progress} aria-hidden="true">
          <span style={{ width: (position.visible * 100) + "%", left: (position.progress * (1 - position.visible) * 100) + "%" }} />
        </div>
        <CarouselArrows controls={id} previousLabel={t("previousTopics")} nextLabel={t("nextTopics")}
          previous={() => move(-1)} next={() => move(1)}
          atStart={position.progress <= .0001} atEnd={position.visible >= 1 || position.progress >= .9999} />
      </div>
    </div>
  </section>
}
