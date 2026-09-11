import { ChevronLeft, ChevronRight } from "lucide-react"
import { currentMonth, formatMonthTitle, shiftMonth } from "../lib/format"

interface MonthPickerProps {
  value: string
  onChange: (month: string) => void
}

// Anda de mês em mês; não passa do mês atual (não tem extrato do futuro)
export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const isCurrent = value >= currentMonth()

  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-surface-raised shadow-sm">
      <button
        type="button"
        onClick={() => onChange(shiftMonth(value, -1))}
        aria-label="Mês anterior"
        className="grid size-10 place-items-center rounded-l-lg text-ink-secondary hover:bg-page hover:text-ink"
      >
        <ChevronLeft aria-hidden className="size-4" />
      </button>
      <span aria-live="polite" className="min-w-36 px-2 text-center text-sm font-medium text-ink">
        {formatMonthTitle(value)}
      </span>
      <button
        type="button"
        onClick={() => onChange(shiftMonth(value, 1))}
        disabled={isCurrent}
        aria-label="Próximo mês"
        className="grid size-10 place-items-center rounded-r-lg text-ink-secondary hover:bg-page hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <ChevronRight aria-hidden className="size-4" />
      </button>
    </div>
  )
}
