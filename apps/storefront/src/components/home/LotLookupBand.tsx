"use client"

import ManageSearchIcon from "@mui/icons-material/ManageSearch"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useLocalizedHref } from "../common/links"

/** Inline lot lookup that hands off to the documentation page. */
export default function LotLookupBand() {
  const router = useRouter()
  const localize = useLocalizedHref()
  const [lot, setLot] = useState("")

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "brand.lineStrong",
        bgcolor: "#fff",
        borderRadius: 1,
        p: { xs: 3, md: 4 },
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1.1fr" },
        gap: { xs: 3, md: 6 },
        alignItems: "center",
      }}
    >
      <Box>
        <Typography variant="eyebrow" sx={{ color: "secondary.main" }}>
          Lot lookup
        </Typography>
        <Typography variant="h4" component="h2" sx={{ mt: 1 }}>
          Holding a vial? Check its batch record.
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
          Enter the lot number printed on the label to see the batch date and purity result.
        </Typography>
      </Box>
      <Stack
        component="form"
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        onSubmit={(event) => {
          event.preventDefault()
          const value = lot.trim()
          router.push(localize(`/documentation${value ? `?lot=${encodeURIComponent(value)}` : ""}`))
        }}
      >
        <TextField
          value={lot}
          onChange={(event) => setLot(event.target.value)}
          placeholder="e.g. VTD01-2609A"
          label="Lot number"
          slotProps={{ htmlInput: { autoCapitalize: "characters", spellCheck: false } }}
        />
        <Button type="submit" variant="contained" startIcon={<ManageSearchIcon />} sx={{ flexShrink: 0, minHeight: 56 }}>
          Look up
        </Button>
      </Stack>
    </Box>
  )
}
