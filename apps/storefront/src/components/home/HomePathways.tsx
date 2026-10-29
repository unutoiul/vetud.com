import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Icon from "../brand/Icon"
import { LocalizedNextLink } from "../common/links"
import { gutter } from "@/theme/tokens"
import { shopQuery, type CategoryFacet } from "@/lib/catalog-filters"

// Editorial selection only; category names, links, and counts come from the catalog.
const featuredAreas = [
  { handle: "weight-loss-research", icon: "sliders" as const },
  { handle: "sleep-enhancement-research", icon: "clock" as const },
  { handle: "longevity-anti-aging-research", icon: "leaf" as const },
]

/** Direct routes from the hero to selected research areas in the current catalog. */
export default function HomePathways({ categories }: { categories: CategoryFacet[] }) {
  const pathways = featuredAreas.flatMap(area => {
    const category = categories.find(category => category.handle === area.handle)
    return category ? [{
      key: category.handle,
      icon: area.icon,
      title: category.name,
      detail: category.count ? `${category.count} ${category.count === 1 ? "product" : "products"} to explore` : "Coming soon",
      href: `/shop?${shopQuery({ categories: [category.handle] })}`,
    }] : []
  })

  if (!pathways.length) return null

  return <Box sx={{ px: gutter, bgcolor: "background.paper" }}>
    <Box
      component="nav"
      aria-label="Featured research categories"
      data-home-pathways
      sx={{
        maxWidth: 1360,
        mx: "auto",
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0, 1fr)", md: `repeat(${pathways.length}, minmax(0, 1fr))` },
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "8px",
        bgcolor: "background.paper",
        overflow: "hidden",
      }}
    >
      {pathways.map((item, index) => <Box
        key={item.key}
        component={LocalizedNextLink}
        href={item.href}
        aria-labelledby={`pathway-${item.key}-title`}
        aria-describedby={`pathway-${item.key}-description`}
        data-pathway={item.key}
        sx={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: { xs: "44px minmax(0, 1fr) 32px", md: "minmax(0, 1fr) 32px", lg: "48px minmax(0, 1fr) 36px" },
          gridTemplateRows: { xs: "auto", md: "44px auto", lg: "auto" },
          alignItems: "center",
          columnGap: { xs: 1.5, md: 1.5, lg: 2 },
          rowGap: 1.5,
          minHeight: { xs: 112, md: 164, lg: 112 },
          px: { xs: 2.5, sm: 3, lg: 3.5 },
          py: { xs: 2.5, md: 3 },
          boxSizing: "border-box",
          color: "text.primary",
          textDecoration: "none",
          transition: "background-color 160ms ease",
          "&::before": {
            content: '\"\"',
            display: index ? "block" : "none",
            position: "absolute",
            pointerEvents: "none",
            left: { xs: 20, md: 0 },
            right: { xs: 20, md: "auto" },
            top: { xs: 0, md: 24 },
            bottom: { xs: "auto", md: 24 },
            width: { xs: "auto", md: "1px" },
            height: { xs: "1px", md: "auto" },
            bgcolor: "divider",
          },
          "&:first-of-type": { borderRadius: { xs: "7px 7px 0 0", md: "7px 0 0 7px" } },
          "&:last-of-type": { borderRadius: { xs: "0 0 7px 7px", md: "0 7px 7px 0" } },
          "@media (hover: hover)": {
            "&:hover": { bgcolor: "brand.mintWash" },
            "&:hover .pathway-icon-frame, &:hover .pathway-arrow-frame": { bgcolor: "brand.navy", borderColor: "brand.navy", color: "primary.contrastText" },
          },
          "&:active": { bgcolor: "brand.mintLight" },
          "&:focus-visible": { outline: "3px solid", outlineColor: "brand.blue", outlineOffset: -3, bgcolor: "brand.mintWash" },
          "@media (hover: hover) and (prefers-reduced-motion: no-preference)": {
            "&:hover .pathway-arrow": { transform: "translate(2px, -2px)" },
          },
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
            "& .pathway-icon-frame, & .pathway-arrow-frame, & .pathway-arrow": { transition: "none" },
          },
        }}
      >
        <Box className="pathway-icon-frame" aria-hidden="true" sx={{
          gridColumn: 1, gridRow: 1, alignSelf: { xs: "center", md: "start", lg: "center" },
          width: { xs: 44, lg: 48 }, height: { xs: 44, lg: 48 },
          display: "grid", placeItems: "center", border: "1px solid", borderColor: "divider", borderRadius: "10px",
          bgcolor: "brand.mintWash", color: "brand.blue", transition: "background-color 160ms ease, border-color 160ms ease, color 160ms ease",
        }}><Icon name={item.icon} sx={{ fontSize: 24 }} /></Box>
        <Box sx={{ gridColumn: { xs: 2, md: "1 / -1", lg: 2 }, gridRow: { xs: 1, md: 2, lg: 1 }, minWidth: 0 }}>
          <Typography id={`pathway-${item.key}-title`} component="span" sx={{ display: "block", fontSize: { xs: 15, lg: 15.5 }, fontWeight: 600, letterSpacing: "-.025em", lineHeight: 1.45 }}>{item.title}</Typography>
          <Typography id={`pathway-${item.key}-description`} component="span" sx={{ display: "block", mt: .6, color: "brand.navySoft", fontSize: 13, lineHeight: 1.6 }}>{item.detail}</Typography>
        </Box>
        <Box className="pathway-arrow-frame" aria-hidden="true" sx={{
          gridColumn: { xs: 3, md: 2, lg: 3 }, gridRow: 1, alignSelf: { xs: "center", md: "start", lg: "center" },
          width: { xs: 32, lg: 36 }, height: { xs: 32, lg: 36 }, display: "grid", placeItems: "center",
          border: "1px solid", borderColor: "divider", borderRadius: "50%", color: "brand.navySoft",
          transition: "background-color 160ms ease, border-color 160ms ease, color 160ms ease",
        }}><Icon name="arrowUpRight" className="pathway-arrow" sx={{ fontSize: 17, transition: "transform 160ms ease" }} /></Box>
      </Box>)}
    </Box>
  </Box>
}
