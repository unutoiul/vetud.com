import Icon from "../brand/Icon"
import styles from "./CarouselArrows.module.css"

type Props = {
  controls: string
  previousLabel: string
  nextLabel: string
  previous: () => void
  next: () => void
  atStart?: boolean
  atEnd?: boolean
}

export default function CarouselArrows({ controls, previousLabel, nextLabel, previous, next, atStart, atEnd }: Props) {
  return <div className={styles.arrows}>
    <button type="button" aria-controls={controls} aria-label={previousLabel} disabled={atStart} onClick={previous}>
      <Icon name="arrowRight" />
    </button>
    <button type="button" aria-controls={controls} aria-label={nextLabel} disabled={atEnd} onClick={next}>
      <Icon name="arrowRight" />
    </button>
  </div>
}
