import type { ReactNode } from "react"
import Box from "@mui/material/Box"
import GlobalStyles from "@mui/material/GlobalStyles"
import { alpha } from "@mui/material/styles"
import { BOOK_PEPTIDE_COUNT, BOOK_TOPICS, bookPeptideStatus } from "@/content/book"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { brand } from "@/theme/tokens"
import Icon from "../brand/Icon"
import { AppLink } from "../common/links"
import StatusBadge from "../learn/StatusBadge"
import { BOOK } from "./book"
import BookCover from "./BookCover"

/** Layout breakpoints of this page (phones, then very narrow phones). */
const PHONE = "@media (max-width:759px)"
const NARROW = "@media (max-width:390px)"
const SERIF = 'Georgia, "Times New Roman", serif'

const container = { width: "min(calc(100% - 2 * clamp(20px, 5vw, 72px)), 1184px)", mx: "auto" } as const
const heading = { m: 0, fontFamily: SERIF, fontWeight: 400, lineHeight: 1.08, letterSpacing: "-.046em" } as const
const h2 = { ...heading, fontSize: "clamp(34px, 3.45vw, 50px)" } as const
const body = { m: 0, color: "brand.slate625", lineHeight: 1.65 } as const
const iconTile = {
  display: "grid", placeItems: "center", width: 44, height: 44, flex: "none",
  borderRadius: "12px", bgcolor: "brand.slate50", color: "brand.teal725",
} as const
const textLink = {
  display: "inline-flex", alignItems: "center", gap: "8px", minHeight: 44,
  color: "brand.teal725", fontSize: 14, fontWeight: 700,
  textDecoration: "underline", textUnderlineOffset: "4px", textDecorationColor: brand.cyan,
  "&:hover": { textDecorationColor: "currentColor" },
  "& svg": { fontSize: 18 },
} as const
const rings = {
  position: "absolute", content: '""', pointerEvents: "none", zIndex: -1, aspectRatio: "1", borderRadius: "50%",
  background: `repeating-radial-gradient(closest-side, transparent 0 16px, ${alpha(brand.teal, .17)} 16.5px 17.5px)`,
} as const

export default function BookLanding({ buyBox }: { buyBox: ReactNode }) {
  const ct = useContentTranslator()
  const steps = [
    { title: ct("Pay once"), text: ct("Enter your email address and pay securely with Stripe.") },
    { title: ct("Check your email"), text: ct("Your download link arrives by email after payment. Stripe sends your receipt separately.") },
    { title: ct("Download and read"), text: ct("Save the PDF to your phone, tablet or computer. Keep the email to download it again.") },
  ]

  return <Box component="article" aria-labelledby="book-title" sx={{ color: "brand.ink", bgcolor: "brand.white" }}>
    {/* The support strip at the end takes the place of the site-wide footer invitation. */}
    <GlobalStyles styles={{ "body [data-footer-invitation]": { display: "none" } }} />

    <Box component="section" sx={{
      ...container, display: "grid", gridTemplateAreas: `"art intro" "art purchase"`,
      gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", columnGap: "clamp(32px, 6.2vw, 96px)",
      py: "clamp(36px, 4.5vw, 72px)",
      [PHONE]: { gridTemplateAreas: `"intro" "art" "purchase"`, gridTemplateColumns: "minmax(0, 1fr)", pt: "28px", pb: "36px", rowGap: "16px" },
    }}>
      <Box sx={{ gridArea: "intro", alignSelf: "end" }}>
        <Box component="p" sx={{
          m: 0, mb: "14px", display: "flex", alignItems: "center", gap: "8px",
          color: "brand.teal725", fontWeight: 650, fontSize: 14, "& svg": { fontSize: 18 }, [PHONE]: { mb: "8px" },
        }}><Icon name="document" />{ct("VETUD digital book")}</Box>
        <Box component="h1" id="book-title" sx={{ ...heading, fontSize: "clamp(43px, 4.4vw, 68px)" }}>{BOOK.title}</Box>
        <Box component="p" sx={{ ...body, mt: "16px", maxWidth: "51ch", fontSize: "clamp(16px, 1.25vw, 19px)", [PHONE]: { mt: "10px" } }}>
          {ct("A plain-language guide to 32 peptides, from semaglutide to GHK-Cu. Learn what each one does and how far the research has come.")}
        </Box>
        <Box component="a" href="#contents" sx={{ ...textLink, mt: "4px" }}>{ct("Explore the contents")}<Icon name="chevronDown" /></Box>
      </Box>

      <Box component="figure" sx={{
        gridArea: "art", m: 0, display: "grid", gridTemplateRows: "minmax(0, 1fr) auto", minWidth: 0,
        overflow: "hidden", isolation: "isolate", borderRadius: "18px", border: "1px solid", borderColor: "brand.slate125", bgcolor: "brand.slate50",
        [PHONE]: { gridTemplate: "1fr / minmax(0, 1fr) minmax(92px, 27%)" },
      }}>
        <Box sx={{
          display: "grid", placeItems: "center", position: "relative", isolation: "isolate", p: "30px 10px", overflow: "hidden",
          background: `radial-gradient(ellipse at 35% 22%, ${brand.green25}, transparent 60%), linear-gradient(145deg, ${brand.slate125}, ${brand.blue150} 62%, ${brand.slate225})`,
          "&::before": { ...rings, width: "123%", top: "-79%", right: "-65%" },
          "&::after": { ...rings, width: "107%", bottom: "-72%", left: "-48%" },
          [PHONE]: { p: "12px 8px" },
        }}>
          <BookCover alt={ct("Cover of Peptides Explained")} sizes="(min-width: 760px) 266px, 160px" priority controlMotion
            sx={{ width: { xs: "clamp(110px, 27vw, 156px)", sm: 156, md: 266 }, "@media (min-width:760px) and (max-width:899px)": { width: 205 }, transform: "rotate(-6deg)" }} />
        </Box>
        <Box component="figcaption" aria-label={ct("The book at a glance")} sx={{
          display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", p: "18px 8px", textAlign: "center",
          bgcolor: "brand.slate50", borderTop: "1px solid", borderColor: "brand.slate125",
          "& > span": { display: "grid", gap: "3px", alignContent: "center", color: "brand.slate625", fontSize: 13, lineHeight: 1.35 },
          "& > span + span": { borderLeft: "1px solid", borderColor: "brand.slate225" },
          "& strong": { color: "brand.ink", fontFamily: SERIF, fontWeight: 400, fontSize: 26, lineHeight: 1 },
          [PHONE]: {
            gridTemplate: "repeat(3, 1fr) / 1fr", p: "5px 12px", borderTop: 0, borderLeft: "1px solid", borderLeftColor: "brand.slate125",
            "& > span": { py: "6px", gap: "1px", fontSize: 12 },
            "& > span + span": { borderLeft: 0, borderTop: "1px solid", borderTopColor: "brand.slate125" },
            "& strong": { fontSize: 21 },
          },
        }}>
          <span><strong>{BOOK_PEPTIDE_COUNT}</strong>{ct("Peptides")}</span>
          <span><strong>{BOOK_TOPICS.length}</strong>{ct("Topics")}</span>
          <span><strong>PDF</strong>{ct("Format")}</span>
        </Box>
      </Box>

      <Box id="buy" tabIndex={-1} sx={{ gridArea: "purchase", alignSelf: "start", pt: "15px", [PHONE]: { pt: 0 } }}>
        <Box sx={{
          display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px 16px", pt: "20px",
          borderTop: "1px solid", borderColor: "brand.slate125", color: "brand.slate625", fontSize: 14,
        }}>
          <Box component="strong" sx={{ color: "brand.ink", fontSize: 32, letterSpacing: "-.04em", lineHeight: 1.1 }}>
            {BOOK.price} <Box component="small" sx={{ fontSize: 12, fontWeight: 600, letterSpacing: 0 }}>USD</Box>
          </Box>
          <span>{ct("One-time payment, tax included")}</span>
        </Box>
        {buyBox}
      </Box>
    </Box>

    <Box component="section" id="contents" aria-labelledby="contents-title" sx={{ py: "clamp(46px, 6vw, 84px)", borderTop: "1px solid", borderColor: "brand.slate125" }}>
      <Box sx={{
        ...container, display: "grid", gridTemplateColumns: "minmax(0, .85fr) minmax(0, 1.65fr)", gap: "clamp(32px, 6vw, 90px)",
        [PHONE]: { gridTemplateColumns: "minmax(0, 1fr)", gap: "22px" },
      }}>
        <div>
          <Box component="h2" id="contents-title" sx={h2}>{ct("Inside the book")}</Box>
          <Box component="p" sx={{ ...body, mt: "16px", maxWidth: "34ch", [PHONE]: { mt: "10px", maxWidth: "50ch" } }}>
            {ct("Browse by topic to see the peptides, their research status and a free guide to each one.")}
          </Box>
        </div>
        <Box sx={{ borderTop: "1px solid", borderColor: "brand.slate125" }}>
          {BOOK_TOPICS.map(topic => <Box component="details" key={topic.id} sx={{
            borderBottom: "1px solid", borderColor: "brand.slate125",
            "&[open] > summary .book-chevron": { transform: "rotate(180deg)" },
          }}>
            <Box component="summary" sx={{
              display: "flex", alignItems: "center", gap: "16px", p: "16px 4px", lineHeight: 1.4, listStyle: "none", cursor: "pointer",
              "&::-webkit-details-marker": { display: "none" },
              "&:hover": { color: "brand.teal725" },
              [PHONE]: { gap: "10px" },
              [NARROW]: { display: "grid", gridTemplateColumns: "34px minmax(0, 1fr) 18px", gap: "4px 10px" },
            }}>
              <Box component="span" sx={{ ...iconTile, "& svg": { fontSize: 22 }, [PHONE]: { width: 35, height: 38, borderRadius: "9px" }, [NARROW]: { gridRow: "1 / 3" } }}>
                <Icon name={topic.icon} />
              </Box>
              <Box component="span" sx={{ minWidth: 0, display: "grid", flex: 1, gap: "4px" }}>
                <Box component="strong" sx={{ fontSize: "clamp(16px, 1.4vw, 20px)", fontWeight: 650, [PHONE]: { fontSize: 16 } }}>{ct(topic.title)}</Box>
                <Box component="span" sx={{ color: "brand.slate625", fontSize: 13 }}>
                  {topic.peptides.slice(0, 3).map(peptide => peptide.name).join(", ")}{topic.peptides.length > 3 ? "…" : ""}
                </Box>
              </Box>
              <Box component="span" sx={{ fontSize: 13, fontVariantNumeric: "tabular-nums", color: "brand.slate625", whiteSpace: "nowrap", [PHONE]: { fontSize: 12 }, [NARROW]: { gridColumn: 2 } }}>
                {ct.template("{v0} peptides", { v0: topic.peptides.length }, { translateValues: false })}
              </Box>
              <Icon name="chevronDown" className="book-chevron" sx={{ flex: "none", color: "brand.teal725", fontSize: 19, [NARROW]: { gridColumn: 3, gridRow: "1 / 3" } }} />
            </Box>
            <Box component="ul" sx={{
              m: "0 0 18px", p: "0 18px", listStyle: "none", bgcolor: "brand.mintWash", borderRadius: "10px",
              "& > li": { p: "10px 0 15px" },
              "& > li + li": { borderTop: "1px solid", borderColor: "brand.slate125" },
            }}>
              {topic.peptides.map(peptide => {
                const status = bookPeptideStatus(peptide.slug)
                return <li key={peptide.slug}>
                  <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0 16px", justifyContent: "space-between" }}>
                    <AppLink href={`/learn/${peptide.slug}`} sx={{ display: "inline-flex", alignItems: "center", gap: "6px", minHeight: 44, fontSize: 16, color: "brand.teal725", "& svg": { fontSize: 16 } }}>
                      {peptide.name}<Icon name="arrowRight" />
                    </AppLink>
                    {status && <StatusBadge status={status} size="small" />}
                  </Box>
                  <Box component="p" sx={{ ...body, fontSize: 14 }}>{ct(peptide.description)}</Box>
                </li>
              })}
            </Box>
          </Box>)}
        </Box>
      </Box>
    </Box>

    <Box component="section" aria-labelledby="delivery-title" sx={{ py: "clamp(40px, 4.7vw, 68px)", bgcolor: "brand.slate50" }}>
      <Box sx={container}>
        <Box component="h2" id="delivery-title" sx={h2}>{ct("How you get the book")}</Box>
        <Box component="ol" sx={{
          m: "30px 0 0", p: 0, listStyle: "none", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "clamp(20px, 3vw, 46px)",
          [PHONE]: { gridTemplateColumns: "minmax(0, 1fr)", gap: "22px", mt: "24px" },
        }}>
          {steps.map((step, index) => <Box component="li" key={step.title} sx={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            <Box component="span" aria-hidden="true" sx={{
              display: "grid", placeItems: "center", flex: "none", width: 32, height: 32, border: "1px solid", borderColor: "brand.slate225",
              borderRadius: "50%", color: "brand.teal725", fontSize: 14, fontWeight: 700,
            }}>{index + 1}</Box>
            <div>
              <Box component="h3" sx={{ m: 0, fontSize: 18, fontWeight: 650, lineHeight: "32px" }}>{step.title}</Box>
              <Box component="p" sx={{ ...body, mt: "6px", fontSize: 15, maxWidth: "40ch", [PHONE]: { mt: "2px" } }}>{step.text}</Box>
            </div>
          </Box>)}
        </Box>
      </Box>
    </Box>

    <Box component="aside" aria-labelledby="book-help" sx={{ bgcolor: "brand.mintLight" }}>
      <Box sx={{
        ...container, py: "30px", display: "flex", alignItems: "center", gap: "18px",
        [PHONE]: { display: "grid", gridTemplateColumns: "auto 1fr", gap: "12px" },
      }}>
        <Box component="span" sx={{ ...iconTile, borderRadius: "50%", bgcolor: "brand.white", width: 52, height: 52, [PHONE]: { width: 42, height: 42 } }}>
          <Icon name="mail" />
        </Box>
        <div>
          <Box component="h2" id="book-help" sx={{ ...heading, fontSize: "clamp(26px, 2.2vw, 34px)" }}>{ct("Need help with your book?")}</Box>
          <Box component="p" sx={{ ...body, mt: "5px", fontSize: 15 }}>{ct("Get in touch about your payment or download.")}</Box>
        </div>
        <AppLink href="/contact" underline="none" sx={{
          ml: "auto", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "12px", minHeight: 46, p: "8px 18px",
          border: "1px solid", borderColor: "brand.slate225", borderRadius: "8px", color: "brand.ink", fontWeight: 650, fontSize: 14,
          "&:hover": { bgcolor: "brand.white" }, "& svg": { fontSize: 18 },
          [PHONE]: { gridColumn: 2, justifySelf: "start", m: 0 },
        }}>{ct("Contact the VETUD team")}<Icon name="arrowRight" /></AppLink>
      </Box>
    </Box>
  </Box>
}
