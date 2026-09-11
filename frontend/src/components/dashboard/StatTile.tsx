import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { formatMoney, formatMonth } from "../../lib/format"

interface StatTileProps {
  label: string
  // Valores em módulo (saída de R$ 300 vem como 30000)
  cents: number
  previousCents: number
  previousMonth: string
  // Entrada subir é bom; saída subir é ruim
  goodWhenUp: boolean
}

export function StatTile({ label, cents, previousCents, previousMonth, goodWhenUp }: StatTileProps) {
  const delta = cents - previousCents
  const monthName = formatMonth(previousMonth).split(" de ")[0]

  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat"
  const isGood = direction === "flat" ? null : (direction === "up") === goodWhenUp
  const tone = isGood === null ? "text-ink-muted" : isGood ? "text-income" : "text-expense"
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-sm text-ink-secondary">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">{formatMoney(cents)}</p>
      <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${tone}`}>
        <Icon aria-hidden className="size-3.5" />
        {direction === "flat"
          ? `Igual a ${monthName}`
          : `${formatMoney(Math.abs(delta))} ${direction === "up" ? "a mais" : "a menos"} que ${monthName}`}
      </p>
    </div>
  )
}
