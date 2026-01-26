import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"
import { useState, forwardRef } from "react"

interface CurrencyInputProps {
  value: number
  onChange: (value: number) => void
  id?: string
  placeholder?: string
  disabled?: boolean
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, id, placeholder = "R$ 0,00", disabled }, ref) => {
    const [displayValue, setDisplayValue] = useState(formatCurrency(value))

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let input = e.target.value
      input = input.replace(/\D/g, "")
      
      const numericValue = parseInt(input || "0") / 100
      onChange(numericValue)
      setDisplayValue(formatCurrency(numericValue))
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.select()
    }

    return (
      <Input
        ref={ref}
        id={id}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        className="tabular-nums"
      />
    )
  }
)

CurrencyInput.displayName = "CurrencyInput"
