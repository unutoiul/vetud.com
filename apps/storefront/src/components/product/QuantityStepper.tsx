"use client"

import AddIcon from "@mui/icons-material/Add"
import RemoveIcon from "@mui/icons-material/Remove"
import Box from "@mui/material/Box"
import IconButton from "@mui/material/IconButton"

type QuantityStepperProps = {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
  size?: "small" | "medium"
  label?: string
}

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled,
  size = "medium",
  label = "Quantity",
}: QuantityStepperProps) {
  const small = size === "small"
  return (
    <Box
      role="group"
      aria-label={label}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        border: "1px solid",
        borderColor: "brand.lineStrong",
        borderRadius: 1,
        bgcolor: "#fff",
        height: small ? 36 : 48,
      }}
    >
      <IconButton
        size="small"
        aria-label="Decrease quantity"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        sx={{ width: small ? 34 : 44, height: "100%" }}
      >
        <RemoveIcon fontSize="small" />
      </IconButton>
      <Box
        component="output"
        aria-live="polite"
        sx={{ minWidth: small ? 24 : 32, textAlign: "center", fontWeight: 700, fontSize: small ? 14 : 15 }}
      >
        {value}
      </Box>
      <IconButton
        size="small"
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        sx={{ width: small ? 34 : 44, height: "100%" }}
      >
        <AddIcon fontSize="small" />
      </IconButton>
    </Box>
  )
}
