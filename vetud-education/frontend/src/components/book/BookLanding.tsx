import Accordion from "@mui/material/Accordion"
import AccordionDetails from "@mui/material/AccordionDetails"
import AccordionSummary from "@mui/material/AccordionSummary"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import { alpha } from "@mui/material/styles"
import Typography from "@mui/material/Typography"
import type { ReactNode } from "react"
import { BOOK_PEPTIDE_COUNT, BOOK_TOPICS, bookPeptideStatus } from "@/content/book"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { brand, gutter } from "@/theme/tokens"
import Icon, { type IconName } from "../brand/Icon"
import { AppLink } from "../common/links"
import SectionHeading from "../common/SectionHeading"
import StatusBadge from "../learn/StatusBadge"
import { BOOK } from "./book"
import BookCover from "./BookCover"

const column = { maxWidth: 1360, mx: "auto" }

/** The cover on a navy stage with a soft light, the moving cover where the browser can play it. */
function CoverStage({ alt }: { alt: string }) {
  return <Box sx={{
    position: "relative",
    display: "grid",
    placeItems: "center",
    minHeight: { xs: 0, sm: 460, md: 560 },
    p: { xs: 3, md: 6 },
    borderRadius: { xs: "20px", md: "32px" },
    bgcolor: "brand.navyDeep",
    backgroundImage: `radial-gradient(ellipse 70% 60% at 50% 45%, ${alpha(brand.blue, .55)}, transparent 70%), radial-gradient(ellipse 50% 30% at 50% 100%, ${alpha(brand.cyan, .18)}, transparent 70%)`,
    overflow: "hidden",
  }}>
    <BookCover alt={alt} sizes="(min-width: 900px) 340px, 240px" priority sx={{ maxWidth: { xs: 150, sm: 280, md: 340 } }} />
  </Box>
}

/** The whole book page except the pay box, which the page passes in (it reads the email link). */
export default function BookLanding({ buyBox }: { buyBox: ReactNode }) {
  const ct = useContentTranslator()

  const facts: { value: string; label: string }[] = [
    { value: String(BOOK_PEPTIDE_COUNT), label: ct("peptides explained") },
    { value: String(BOOK_TOPICS.length), label: ct("topics, from weight to sleep") },
    { value: "PDF", label: ct("for any phone, tablet or computer") },
    { value: BOOK.price, label: ct("one-off, no subscription") },
  ]

  const steps: { icon: IconName; title: string; text: string }[] = [
    { icon: "card", title: ct("Pay $4.99"), text: ct("Enter your email and pay securely with Stripe. Card, Apple Pay and Google Pay work.") },
    { icon: "mail", title: ct("Check your email"), text: ct("Straight after paying, we email you the link to your book.") },
    { icon: "download", title: ct("Download and read"), text: ct("Save the PDF and read it on any device. The link keeps working.") },
  ]

  const questions: { q: string; a: string }[] = [
    { q: ct("What's in the book?"), a: ct("32 peptides, grouped by what they're studied for. For each one: what it is, how it works, and what the research says so far, in plain words.") },
    { q: ct("Is this medical advice?"), a: ct("No. The book explains published research for education. It gives no doses and doesn't tell you to use anything. Talk to a doctor before starting, stopping or changing any treatment.") },
    { q: ct("How do I get the book?"), a: ct("After you pay, we email you a link to download the PDF. Keep the email: the link keeps working if you need the book again.") },
    { q: ct("Why might I see another currency?"), a: ct("The price is US$4.99. Stripe may offer to show it in your own currency; you can choose either at checkout.") },
    { q: ct("Who handles the payment?"), a: ct("Stripe sells the book for us as our reseller. It takes the payment, handles any sales tax or VAT and emails your receipt. We never see your card details.") },
    { q: ct("What if something goes wrong?"), a: ct("If the email doesn't arrive or the file doesn't open, write to contact@vetud.com and we'll fix it or refund you.") },
  ]

  return <>
    {/* Hero: the book on the right, what it is and the pay box on the left. */}
    <Box component="section" sx={{ px: gutter, pt: { xs: 4, md: 8 }, pb: { xs: 6, md: 10 }, bgcolor: "background.default" }}>
      <Box sx={{ ...column, display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) minmax(0, 1fr)" }, gap: { xs: 4, md: 7 }, alignItems: "center" }}>
        <Box sx={{ order: { xs: 2, md: 1 }, minWidth: 0 }}>
          <Typography variant="eyebrow" sx={{ color: "brand.blue", letterSpacing: ".06em" }}>{ct("The VETUD book · PDF")}</Typography>
          <Typography variant="h1" sx={{ mt: 1.5, fontSize: { xs: 44, sm: 60, md: 72 } }}>{BOOK.title}</Typography>
          <Typography variant="lead" sx={{ mt: 2, maxWidth: 560, fontSize: { xs: 19, md: 22 }, lineHeight: 1.45, color: "text.secondary" }}>
            {ct("32 peptides explained in detail, in plain language.")}
          </Typography>
          <Typography sx={{ mt: 2, maxWidth: 560, color: "text.secondary", fontSize: 16, lineHeight: 1.7 }}>
            {ct("From semaglutide and tirzepatide to BPC-157 and GHK-Cu: what each one is, how it works and how far the research has got. No jargon, no hype, no doses.")}
          </Typography>
          <Box sx={{ mt: { xs: 3, md: 4 }, maxWidth: 480 }}>{buyBox}</Box>
        </Box>
        <Box sx={{ order: { xs: 1, md: 2 } }}>
          <CoverStage alt={ct("Peptides Explained: 32 peptides explained in detail")} />
        </Box>
      </Box>
    </Box>

    {/* Quick facts. */}
    <Box component="section" aria-label={ct("The book at a glance")} sx={{ px: gutter, py: { xs: 3, md: 4 }, bgcolor: "brand.navy", color: "brand.onNavy" }}>
      <Box component="ul" sx={{ ...column, listStyle: "none", p: 0, m: "0 auto", display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" }, gap: { xs: 2.5, md: 4 } }}>
        {facts.map(fact => <Box component="li" key={fact.label}>
          <Typography sx={{ fontSize: { xs: 30, md: 38 }, fontWeight: 600, letterSpacing: "-.04em", lineHeight: 1.1, color: "brand.mint" }}>{fact.value}</Typography>
          <Typography sx={{ mt: .5, color: "brand.onNavyMuted", fontSize: 14 }}>{fact.label}</Typography>
        </Box>)}
      </Box>
    </Box>

    {/* The 32 peptides, by topic. */}
    <Box component="section" sx={{ px: gutter, py: { xs: 7, md: 11 }, bgcolor: "background.paper" }}>
      <Box sx={column}>
        <SectionHeading
          eyebrow="Inside the book"
          title={ct("The 32 peptides, in plain words")}
          description={ct("Every peptide in the book, with a one-line summary and how far it has got: approved medicine, in human trials, or early research. Tap a name to read our free guide.")}
        />
        <Box sx={{ display: "grid", gap: { xs: 5, md: 6 } }}>
          {BOOK_TOPICS.map(topic => <Box key={topic.id} component="section" aria-labelledby={`topic-${topic.id}`}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <Box sx={{ display: "grid", placeItems: "center", width: 40, height: 40, borderRadius: "12px", bgcolor: "brand.mintWash", color: "brand.teal" }}>
                <Icon name={topic.icon} sx={{ fontSize: 22 }} />
              </Box>
              <Typography id={`topic-${topic.id}`} component="h3" sx={{ fontSize: { xs: 21, md: 24 }, fontWeight: 600, letterSpacing: "-.02em" }}>{ct(topic.title)}</Typography>
              <Typography component="span" sx={{ color: "text.secondary", fontSize: 14 }}>{topic.peptides.length}</Typography>
            </Box>
            <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }, gap: 1.5 }}>
              {topic.peptides.map(peptide => {
                const status = bookPeptideStatus(peptide.slug)
                return <Box component="li" key={peptide.slug} sx={{ display: "flex", flexDirection: "column", gap: 1, p: 2.25, borderRadius: "16px", border: 1, borderColor: "brand.line", bgcolor: "background.default", transition: "border-color .2s ease, box-shadow .2s ease", "&:hover": { borderColor: "brand.lineStrong", boxShadow: `0 10px 26px ${brand.navyA07}` } }}>
                  <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                    <AppLink href={`/learn/${peptide.slug}`} sx={{ color: "text.primary", fontSize: 18, fontWeight: 650, letterSpacing: "-.01em", textDecoration: "none", "&:hover": { color: "brand.blue", textDecoration: "underline" } }}>{peptide.name}</AppLink>
                    {status ? <StatusBadge status={status} size="small" /> : null}
                  </Box>
                  <Typography sx={{ color: "text.secondary", fontSize: 15, lineHeight: 1.55 }}>{ct(peptide.description)}</Typography>
                </Box>
              })}
            </Box>
          </Box>)}
        </Box>
      </Box>
    </Box>

    {/* How it works. */}
    <Box component="section" sx={{ px: gutter, py: { xs: 7, md: 10 }, bgcolor: "background.default" }}>
      <Box sx={column}>
        <SectionHeading eyebrow="How it works" title={ct("Three steps to your book")} />
        <Box component="ol" sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
          {steps.map((step, index) => <Box component="li" key={step.title} sx={{ p: 3, borderRadius: "20px", bgcolor: "background.paper", border: 1, borderColor: "brand.line" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ display: "grid", placeItems: "center", width: 44, height: 44, borderRadius: "50%", bgcolor: "brand.navy", color: "brand.mint" }}><Icon name={step.icon} sx={{ fontSize: 22 }} /></Box>
              <Typography sx={{ color: "brand.blue", fontSize: 13, fontWeight: 650 }}>{ct.template("Step {v0}", { v0: index + 1 }, { translateValues: false })}</Typography>
            </Box>
            <Typography component="h3" sx={{ mt: 2, fontSize: 22, fontWeight: 600, letterSpacing: "-.02em" }}>{step.title}</Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", fontSize: 15.5, lineHeight: 1.6 }}>{step.text}</Typography>
          </Box>)}
        </Box>
      </Box>
    </Box>

    {/* Questions. */}
    <Box component="section" sx={{ px: gutter, py: { xs: 7, md: 10 }, bgcolor: "background.paper" }}>
      <Box sx={{ ...column, maxWidth: 860 }}>
        <SectionHeading eyebrow="Questions" title={ct("Good to know before you buy")} />
        {questions.map(item => <Accordion key={item.q} disableGutters elevation={0} sx={{ bgcolor: "transparent", borderBottom: 1, borderColor: "brand.line", "&::before": { display: "none" } }}>
          <AccordionSummary expandIcon={<Icon name="chevronDown" />} sx={{ px: 0, minHeight: 64, "& .MuiAccordionSummary-content": { my: 2 } }}>
            <Typography component="h3" sx={{ fontSize: 18, fontWeight: 600 }}>{item.q}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0, pt: 0, pb: 2.5 }}>
            <Typography sx={{ color: "text.secondary", fontSize: 16, lineHeight: 1.7 }}>{item.a}</Typography>
          </AccordionDetails>
        </Accordion>)}
      </Box>
    </Box>

    {/* Last call: back up to the pay box. */}
    <Box component="section" sx={{ px: gutter, py: { xs: 6, md: 9 }, bgcolor: "brand.navy", color: "brand.onNavy" }}>
      <Box sx={{ ...column, maxWidth: 1040, display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "160px minmax(0, 1fr)" }, gap: { xs: 3, sm: 5 }, alignItems: "center" }}>
        <BookCover alt="" sizes="160px" sx={{ maxWidth: { xs: 130, sm: 160 } }} />
        <Box>
          <Typography variant="h2" sx={{ color: "brand.onNavy", fontSize: { xs: 32, md: 44 } }}>{ct("All 32 peptides, one clear book.")}</Typography>
          <Typography sx={{ mt: 1.5, color: "brand.onNavyMuted", fontSize: 17, lineHeight: 1.6 }}>{ct("$4.99, paid once. The download link arrives by email straight after you pay.")}</Typography>
          <Button href="#buy" variant="contained" size="large" endIcon={<Icon name="arrowRight" />} sx={{ mt: 3, minHeight: 54, px: 3.5, borderRadius: "14px", fontWeight: 700, color: "brand.navyDeep", bgcolor: "brand.mint", "&:hover": { bgcolor: "brand.tealBright" } }}>
            {ct.template("Download PDF for {v0}", { v0: BOOK.price }, { translateValues: false })}
          </Button>
          <Typography sx={{ mt: 2.5, color: "brand.onNavyMuted", fontSize: 12.5, lineHeight: 1.6 }}>
            {ct("Education only. The book explains published research; it isn't medical advice and gives no doses.")}
          </Typography>
        </Box>
      </Box>
    </Box>
  </>
}
