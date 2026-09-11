import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react"
import { formatMoney, formatPercent } from "../lib/format"
import type { Budget } from "../lib/types"
import { CategoryBadge } from "./ui/CategoryBadge"

// A situação nunca vai só na cor: sempre ícone e texto junto
const STATUS = {
  ok: { label: "Dentro do limite", icon: CircleCheck, fill: "bg-meter-ok", track: "bg-meter-ok-track", text: "text-ink-secondary" },
  warning: { label: "Perto do limite", icon: TriangleAlert, fill: "bg-meter-warning", track: "bg-meter-warning-track", text: "text-warning" },
  over: { label: "Estourou", icon: CircleAlert, fill: "bg-meter-over", track: "bg-meter-over-track", text: "text-expense" },
}

export function BudgetMeter({ budget }: { budget: Budget }) {
  const status = STATUS[budget.status]
  const Icon = status.icon
  const width = `${Math.min(budget.used_share, 1) * 100}%`

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <CategoryBadge category={budget.category} />
        <p className="text-sm text-ink-secondary">
          <span className="tabular font-medium text-ink">{formatMoney(budget.spent_cents)}</span> de{" "}
          <span className="tabular">{formatMoney(budget.limit_cents)}</span>
        </p>
      </div>

      <div
        role="progressbar"
        aria-label={`Orçamento de ${budget.category.name}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(budget.used_share * 100)}
        className={`mt-2 h-2 overflow-hidden rounded-full ${status.track}`}
      >
        <div className={`h-full rounded-full ${status.fill}`} style={{ width }} />
      </div>

      <p className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${status.text}`}>
        <Icon aria-hidden className="size-3.5" />
        {status.label} · {formatPercent(budget.used_share)}
        {budget.remaining_cents >= 0
          ? ` · sobram ${formatMoney(budget.remaining_cents)}`
          : ` · passou ${formatMoney(Math.abs(budget.remaining_cents))}`}
      </p>
    </div>
  )
}
