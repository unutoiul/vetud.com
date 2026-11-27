import type { ReactNode } from "react"
import { BOOK_PEPTIDE_COUNT, BOOK_TOPICS, bookPeptideStatus } from "@/content/book"
import { useContentTranslator } from "@/i18n/use-content-translator"
import Icon from "../brand/Icon"
import { AppLink } from "../common/links"
import StatusBadge from "../learn/StatusBadge"
import { BOOK } from "./book"
import BookCover from "./BookCover"
import styles from "./BookLanding.module.css"

export default function BookLanding({ buyBox }: { buyBox: ReactNode }) {
  const ct = useContentTranslator()
  const steps = [
    { title: ct("Pay once"), text: ct("Enter your email address and pay securely with Stripe.") },
    { title: ct("Check your email"), text: ct("Your download link arrives by email after payment. Stripe sends your receipt separately.") },
    { title: ct("Download and read"), text: ct("Save the PDF to your phone, tablet or computer. Keep the email to download it again.") },
  ]
  const questions = [
    { q: ct("What's in the book?"), a: ct("32 peptides, grouped by what they're studied for. For each one: what it is, how it works, and what the research says so far, in plain words.") },
    { q: ct("Is this medical advice?"), a: ct("No. The book explains published research for education. It gives no doses and doesn't tell you to use anything. Talk to a doctor before starting, stopping or changing any treatment.") },
    { q: ct("How do I get the book?"), a: ct("After you pay, we email you a link to download the PDF. Keep the email: the link keeps working if you need the book again.") },
    { q: ct("Why might I see another currency?"), a: ct("The price is US$4.99. Stripe may offer to show it in your own currency; you can choose either at checkout.") },
    { q: ct("Who handles the payment?"), a: ct("Stripe sells the book for us as our reseller. It takes the payment, handles any sales tax or VAT and emails your receipt. We never see your card details.") },
    { q: ct("What if something goes wrong?"), a: ct("If the email doesn't arrive or the file doesn't open, write to contact@vetud.com and we'll fix it or refund you.") },
  ]

  return <article className={styles.page} aria-labelledby="book-title">
    <section className={styles.hero}>
      <div className={styles.intro}>
        <p className={styles.edition}><Icon name="document" />{ct("VETUD digital book")}</p>
        <h1 id="book-title">{BOOK.title}</h1>
        <p className={styles.lead}>{ct("A plain-language guide to 32 peptides, from semaglutide to GHK-Cu. Learn what each one does and how far the research has come.")}</p>
        <a className={styles.textLink} href="#contents">{ct("Explore the contents")}<Icon name="chevronDown" /></a>
      </div>

      <figure className={styles.plate}>
        <div className={styles.artwork}>
          <BookCover alt={ct("Cover of Peptides Explained")} sizes="(min-width: 760px) 266px, 160px" priority controlMotion
            sx={{ width: { xs: "clamp(110px, 27vw, 156px)", sm: 156, md: 266 }, "@media (min-width:760px) and (max-width:899px)": { width: 205 }, transform: "rotate(-6deg)" }} />
        </div>
        <figcaption className={styles.facts} aria-label={ct("The book at a glance")}>
          <span><strong>{BOOK_PEPTIDE_COUNT}</strong>{ct("Peptides")}</span>
          <span><strong>{BOOK_TOPICS.length}</strong>{ct("Topics")}</span>
          <span><strong>PDF</strong>{ct("Format")}</span>
        </figcaption>
      </figure>

      <div id="buy" tabIndex={-1} className={styles.purchase}>
        <div className={styles.price}>
          <strong>{BOOK.price} <small>USD</small></strong>
          <span>{ct("One-time payment, tax included")}</span>
        </div>
        {buyBox}
      </div>
    </section>

    <section id="contents" className={styles.section} aria-labelledby="contents-title">
      <div className={styles.split}>
        <div className={styles.sectionIntro}>
          <h2 id="contents-title">{ct("Inside the book")}</h2>
          <p>{ct("Browse by topic to see the peptides, their research status and a free guide to each one.")}</p>
        </div>
        <div className={styles.index}>
          {BOOK_TOPICS.map(topic => <details className={styles.topic} key={topic.id}>
            <summary>
              <span className={styles.topicIcon}><Icon name={topic.icon} /></span>
              <span className={styles.topicText}>
                <strong>{ct(topic.title)}</strong>
                <span>{topic.peptides.slice(0, 3).map(peptide => peptide.name).join(", ")}{topic.peptides.length > 3 ? "…" : ""}</span>
              </span>
              <span className={styles.count}>{ct.template("{v0} peptides", { v0: topic.peptides.length }, { translateValues: false })}</span>
              <Icon name="chevronDown" className={styles.chevron} />
            </summary>
            <ul className={styles.entries}>
              {topic.peptides.map(peptide => {
                const status = bookPeptideStatus(peptide.slug)
                return <li key={peptide.slug}>
                  <div className={styles.entryTitle}>
                    <AppLink href={`/learn/${peptide.slug}`}>{peptide.name}<Icon name="arrowRight" /></AppLink>
                    {status && <StatusBadge status={status} size="small" />}
                  </div>
                  <p>{ct(peptide.description)}</p>
                </li>
              })}
            </ul>
          </details>)}
        </div>
      </div>
    </section>

    <section className={styles.delivery} aria-labelledby="delivery-title">
      <div className={styles.inner}>
        <h2 id="delivery-title">{ct("How you get the book")}</h2>
        <ol className={styles.steps}>
          {steps.map((step, index) => <li key={step.title}>
            <span className={styles.stepNumber} aria-hidden="true">{index + 1}</span>
            <div><h3>{step.title}</h3><p>{step.text}</p></div>
          </li>)}
        </ol>
      </div>
    </section>

    <section className={styles.section} aria-labelledby="questions-title">
      <div className={styles.split}>
        <div className={styles.sectionIntro}>
          <h2 id="questions-title">{ct("Before you buy")}</h2>
          <a href="#buy" className={styles.textLink}>{ct.template("Get the PDF for {v0}", { v0: BOOK.price }, { translateValues: false })}<Icon name="arrowRight" /></a>
        </div>
        <div className={styles.index}>
          {questions.map(item => <details key={item.q} className={styles.question}>
            <summary>{item.q}<Icon name="chevronDown" className={styles.chevron} /></summary>
            <p>{item.a}</p>
          </details>)}
        </div>
      </div>
    </section>

    <aside className={styles.support} aria-labelledby="book-help">
      <div className={styles.supportInner}>
        <span className={styles.supportIcon}><Icon name="mail" /></span>
        <div><h2 id="book-help">{ct("Need help with your book?")}</h2><p>{ct("Get in touch about your payment or download.")}</p></div>
        <AppLink href="/contact" className={styles.supportLink}>{ct("Contact the VETUD team")}<Icon name="arrowRight" /></AppLink>
      </div>
    </aside>
  </article>
}
