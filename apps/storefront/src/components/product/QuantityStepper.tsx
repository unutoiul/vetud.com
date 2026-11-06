"use client"

import { useTranslations } from "next-intl"

import { PlusIcon as AddIcon, MinusIcon as RemoveIcon } from "@/components/brand/Icon"
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
  label,
}: QuantityStepperProps) {
  const act = useTranslations("Actions")
  const small = size === "small"
  return (
    <Box
      role="group"
      aria-label={label ?? act("quantity")}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        border: "1px solid",
        borderColor: "brand.lineStrong",
        borderRadius: 2.5,
        bgcolor: "#fff",
        height: small ? 44 : 52,
      }}
    >
      <IconButton
        size="small"
        aria-label={act("decreaseQuantity")}
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        sx={{ width: small ? 34 : 44, height: "100%" }}
      >
        <RemoveIcon fontSize="small" />
      </IconButton>
      <Box
        component="output"
        aria-live="polite"
        sx={{ minWidth: small ? 24 : 32, textAlign: "center", fontWeight: 600, fontSize: small ? 14 : 15, fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </Box>
      <IconButton
        size="small"
        aria-label={act("increaseQuantity")}
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        sx={{ width: small ? 34 : 44, height: "100%" }}
      >
        <AddIcon fontSize="small" />
      </IconButton>
    </Box>
  )
}
