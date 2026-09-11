import { Check } from "lucide-react"
import { CATEGORY_COLOR_LABELS, CATEGORY_COLORS, categoryColorVar } from "../../lib/categoryColors"
import type { CategoryColor } from "../../lib/types"

interface ColorPickerProps {
  value: CategoryColor
  onChange: (color: CategoryColor) => void
}

// As 8 cores da paleta, em bolinhas; o nome da cor vai no aria-label
export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div role="radiogroup" aria-label="Cor" className="flex flex-wrap gap-2">
      {CATEGORY_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={CATEGORY_COLOR_LABELS[color]}
          onClick={() => onChange(color)}
          className="grid size-8 place-items-center rounded-full ring-offset-2 ring-offset-surface transition-shadow focus-visible:outline-2 focus-visible:outline-action aria-checked:ring-2 aria-checked:ring-ink"
          style={{ background: categoryColorVar(color) }}
        >
          {value === color && <Check aria-hidden className="size-4 text-white" strokeWidth={3} />}
        </button>
      ))}
    </div>
  )
}
