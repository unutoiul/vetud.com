import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import { BOOK } from "@/components/book/book"
import Icon from "@/components/brand/Icon"
import { ButtonLink } from "@/components/common/links"
import Section from "@/components/common/Section"
import { getContentTranslator } from "@/i18n/server-content"
import { brand } from "@/theme/tokens"

export default async function BookFeature() {
  const ct = await getContentTranslator()

  return (
    <Section id="featured-book" aria-labelledby="featured-book-title" tone="wash" sx={{
      py: { xs: 4, sm: 5, md: 6 },
      overflow: "hidden",
      backgroundImage: `linear-gradient(110deg, ${brand.mintWash}, ${brand.slate50} 55%, ${brand.blue125})`,
    }}>
      <Box sx={{
        maxWidth: 1080, mx: "auto", display: "grid", alignItems: "center",
        gridTemplateAreas: { xs: '"heading cover" "description description" "action action"', sm: '"heading cover" "description cover" "action cover"' },
        gridTemplateColumns: { xs: "minmax(0, 1fr) auto", sm: "minmax(0, 1.4fr) minmax(0, 1fr)" },
        gridTemplateRows: { sm: "1fr auto 1fr" },
        columnGap: { xs: 2, sm: 4, md: 9 }, rowGap: { xs: 2, sm: 1.75 },
      }}>
        <Box sx={{ gridArea: "heading", alignSelf: { sm: "end" } }}>
          <Typography component="p" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25, fontSize: 14, fontWeight: 650, color: "brand.teal725" }}>
            <Icon name="document" sx={{ fontSize: 18 }} />{ct("PDF edition")}
          </Typography>
          <Typography component="h2" variant="h2" id="featured-book-title" sx={{
            fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400,
            fontSize: { xs: "clamp(2.35rem, 8.5vw, 3.25rem)", sm: "clamp(2.65rem, 5vw, 4.5rem)" },
            letterSpacing: "-.045em", lineHeight: 1.06,
          }}>{BOOK.title}</Typography>
        </Box>
        <Typography sx={{ gridArea: "description", maxWidth: "49ch", color: "brand.navySoft", fontSize: { xs: 16, md: 18 }, lineHeight: 1.65 }}>
          {ct("A plain-language guide to 32 peptides, from semaglutide to GHK-Cu. Learn what each one does and how far the research has come.")}
        </Typography>
        <Box sx={{ gridArea: "action", alignSelf: "start", mt: .75, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
          <ButtonLink href="/book" variant="contained" endIcon={<Icon name="arrowRight" />}>
            {ct("Explore the book")}
          </ButtonLink>
          <Typography component="span" sx={{ fontSize: 16, fontWeight: 650 }}>{BOOK.price} USD</Typography>
        </Box>
        <Box aria-hidden="true" sx={{
          gridArea: "cover", justifySelf: "center", position: "relative", isolation: "isolate",
          width: { xs: "clamp(90px, 22vw, 118px)", sm: 158, md: 196 },
          "&::before": {
            content: '""', position: "absolute", zIndex: -1, top: "50%", left: "50%",
            width: "158%", aspectRatio: "1", borderRadius: "50%", transform: "translate(-50%, -50%)",
            background: `repeating-radial-gradient(closest-side, transparent 0 15px, ${brand.slate125} 16px 17px)`,
          },
        }}>
          <Image src={BOOK.cover} alt="" width={640} height={960}
            sizes="(min-width: 900px) 196px, (min-width: 600px) 158px, 118px"
            style={{ display: "block", width: "100%", height: "auto", transform: "rotate(-6deg)", filter: `drop-shadow(0 12px 12px ${brand.blackA22})` }} />
        </Box>
      </Box>
    </Section>
  )
}
