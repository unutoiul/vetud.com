import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { alpha } from "@mui/material/styles"
import { BOOK } from "@/components/book/book"
import BookScene from "@/components/book/BookScene"
import Icon, { type IconName } from "@/components/brand/Icon"
import { AppLink, ButtonLink } from "@/components/common/links"
import Section from "@/components/common/Section"
import { BOOK_PEPTIDE_COUNT, BOOK_TOPICS } from "@/content/book"
import { getContentTranslator } from "@/i18n/server-content"
import { brand } from "@/theme/tokens"

/**
 * The home page's advert for the $4.99 PDF: a navy band with the cover, price and topics. Selling the book is fine on
 * vetud.com; it never links to the shop, and it promises knowledge, not results (no doses, no outcomes).
 */
export default async function BookFeature() {
  const ct = await getContentTranslator()
  const benefits: { icon: IconName; text: string }[] = [
    { icon: "molecule", text: ct("What each peptide is and what it does in the body") },
    { icon: "shield", text: ct("Approved, in trials or research only: the status of every one") },
    { icon: "flask", text: ct("What studies in people have found, and where the evidence stops") },
    { icon: "eye", text: ct("No hype, no doses and no sales pitch") },
  ]

  return (
    <Section
      id="featured-book"
      aria-labelledby="featured-book-title"
      tone="navy"
      sx={{
        py: { xs: 6, md: 10 },
        overflow: "hidden",
        backgroundImage: `radial-gradient(circle at 78% 32%, ${alpha(brand.blue, 0.42)}, transparent 46%), radial-gradient(circle at 8% 100%, ${alpha(brand.teal, 0.35)}, transparent 40%)`,
      }}
    >
      <Box
        sx={{
          maxWidth: 1180,
          mx: "auto",
          display: "grid",
          alignItems: "center",
          gridTemplateAreas: { xs: '"cover" "copy" "topics"', md: '"copy cover" "topics topics"' },
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.25fr) minmax(0, 1fr)" },
          columnGap: 8,
          rowGap: { xs: 4, md: 7 },
        }}
      >
        <Box sx={{ gridArea: "copy" }}>
          <Typography
            component="p"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              py: 0.75,
              borderRadius: "999px",
              bgcolor: alpha(brand.cyan, 0.14),
              color: brand.cyan,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: ".02em",
            }}
          >
            <Icon name="document" sx={{ fontSize: 17 }} />
            {ct("VETUD digital book")}
          </Typography>
          <Typography
            component="h2"
            id="featured-book-title"
            sx={{
              mt: 2,
              color: brand.onNavy,
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 400,
              fontSize: { xs: "clamp(2.5rem, 11vw, 3.4rem)", md: "clamp(3.4rem, 5.2vw, 4.9rem)" },
              letterSpacing: "-.045em",
              lineHeight: 1.02,
            }}
          >
            {BOOK.title}
          </Typography>
          <Typography
            sx={{
              mt: 1.5,
              color: brand.onNavy,
              fontSize: { xs: 20, md: 24 },
              fontWeight: 500,
              lineHeight: 1.35,
              letterSpacing: "-.02em",
              maxWidth: "30ch",
            }}
          >
            {ct("The peptides everyone is talking about, explained in one honest guide.")}
          </Typography>
          <Typography
            sx={{ mt: 2, color: brand.onNavyMuted, fontSize: { xs: 16, md: 17 }, lineHeight: 1.7, maxWidth: "54ch" }}
          >
            {ct(
              "Social media is full of bold claims and forums are full of guesswork. This book gives you the facts on 32 peptides in plain words, so you can follow the conversation and ask better questions.",
            )}
          </Typography>

          <Box component="ul" sx={{ listStyle: "none", m: 0, mt: 3, p: 0, display: "grid", gap: 1.5 }}>
            {benefits.map((benefit) => (
              <Box
                component="li"
                key={benefit.icon}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  color: brand.onNavy,
                  fontSize: { xs: 15, md: 16 },
                  lineHeight: 1.45,
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    placeItems: "center",
                    width: 34,
                    height: 34,
                    flex: "none",
                    borderRadius: "10px",
                    bgcolor: alpha(brand.cyan, 0.14),
                    color: brand.cyan,
                  }}
                >
                  <Icon name={benefit.icon} sx={{ fontSize: 19 }} />
                </Box>
                {benefit.text}
              </Box>
            ))}
          </Box>

          <Box sx={{ mt: 4, display: "flex", flexWrap: "wrap", alignItems: "center", gap: { xs: 1.5, sm: 3 } }}>
            <ButtonLink
              href="/book#buy"
              variant="contained"
              size="large"
              endIcon={<Icon name="arrowRight" />}
              sx={{
                bgcolor: brand.cyan,
                color: brand.navyDeep,
                fontWeight: 700,
                boxShadow: "none",
                "&:hover": { bgcolor: brand.tealBright, boxShadow: "none" },
                "&:focus-visible": { outline: `3px solid ${brand.onNavy}`, outlineOffset: 3 },
              }}
            >
              {ct.template("Get the PDF for {v0}", { v0: BOOK.price }, { translateValues: false })}
            </ButtonLink>
            <AppLink
              href="/book#contents"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 44,
                color: brand.onNavy,
                fontSize: 15,
                fontWeight: 650,
                textUnderlineOffset: 5,
                textDecorationColor: brand.cyan,
                "&:hover": { textDecorationColor: "currentColor" },
              }}
            >
              {ct("See all 32 peptides inside")}
            </AppLink>
          </Box>
          <Typography
            sx={{
              mt: 2,
              display: "flex",
              alignItems: "flex-start",
              gap: 1,
              color: brand.onNavyMuted,
              fontSize: 13.5,
              lineHeight: 1.5,
            }}
          >
            <Icon name="lock" sx={{ fontSize: 17, mt: "1px" }} />
            {ct("One-time payment, tax included. Pay securely with Stripe and get your download link by email.")}
          </Typography>
        </Box>

        <Box
          sx={{
            gridArea: "cover",
            justifySelf: "center",
            width: "100%",
            maxWidth: 560,
            borderRadius: "18px",
            overflow: "hidden",
          }}
        >
          <BookScene href="/book" alt={ct("View Peptides: The Complete Guide")} />
        </Box>

        <Box sx={{ gridArea: "topics", pt: { xs: 3, md: 4 }, borderTop: `1px solid ${alpha(brand.onNavy, 0.14)}` }}>
          <Typography component="h3" sx={{ color: brand.onNavy, fontSize: 15, fontWeight: 700 }}>
            {ct("Inside the book")}
            <Box component="span" sx={{ ml: 1, color: brand.onNavyMuted, fontWeight: 500 }}>
              {BOOK_PEPTIDE_COUNT} {ct("peptides")} · {BOOK_TOPICS.length} {ct("topics")}
            </Box>
          </Typography>
          <Box
            component="ul"
            sx={{
              listStyle: "none",
              m: 0,
              mt: 2,
              p: 0,
              display: "grid",
              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))",
              },
              gap: 1.25,
            }}
          >
            {BOOK_TOPICS.map((topic) => (
              <Box
                component="li"
                key={topic.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  px: 1.75,
                  py: 1.25,
                  borderRadius: "12px",
                  bgcolor: alpha(brand.onNavy, 0.06),
                  border: `1px solid ${alpha(brand.onNavy, 0.1)}`,
                  color: brand.onNavy,
                  fontSize: 14.5,
                }}
              >
                <Icon name={topic.icon} sx={{ fontSize: 19, color: brand.cyan, flex: "none" }} />
                <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
                  {ct(topic.title)}
                </Box>
                <Box component="span" sx={{ color: brand.onNavyMuted, fontSize: 13, fontWeight: 650 }}>
                  {topic.peptides.length}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Section>
  )
}
