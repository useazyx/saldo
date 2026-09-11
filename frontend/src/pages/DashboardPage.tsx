import { useState } from "react"
import { useAuth } from "../auth/AuthContext"
import { BudgetMeter } from "../components/BudgetMeter"
import { CategorySpendingChart } from "../components/dashboard/CategorySpendingChart"
import { MonthlyTrendChart } from "../components/dashboard/MonthlyTrendChart"
import { StatTile } from "../components/dashboard/StatTile"
import { MonthPicker } from "../components/MonthPicker"
import { Alert } from "../components/ui/Alert"
import { Card } from "../components/ui/Card"
import { errorMessage } from "../lib/api"
import { currentMonth, formatMonth, formatSignedMoney } from "../lib/format"
import { useBudgets, useCategorySlices, useMonthlyTrend, useMonthSummary } from "../lib/queries"

export function DashboardPage() {
  const { user } = useAuth()
  const [month, setMonth] = useState(currentMonth)

  const summary = useMonthSummary(month)
  const slices = useCategorySlices(month)
  const trend = useMonthlyTrend(month, 6)
  const budgets = useBudgets(month)

  const monthName = formatMonth(month).split(" de ")[0]
  const error = summary.error ?? slices.error ?? trend.error ?? budgets.error
  // Enquanto o mês novo carrega, a tela anterior continua (só fica mais clara)
  const refreshing = summary.isPlaceholderData || slices.isPlaceholderData

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Olá, {user?.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-ink-muted">Como foi o seu dinheiro em {monthName}.</p>
        </div>
        <MonthPicker value={month} onChange={setMonth} />
      </header>

      {error && <Alert>{errorMessage(error)}</Alert>}

      {summary.data && (
        <div className={`flex flex-col gap-6 transition-opacity ${refreshing ? "opacity-60" : ""}`}>
          <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-sm text-ink-secondary">Saldo do mês</p>
              <p
                className={`mt-1 text-5xl font-semibold tracking-tight ${
                  summary.data.net_cents < 0 ? "text-expense" : "text-ink"
                }`}
              >
                {formatSignedMoney(summary.data.net_cents)}
              </p>
              <p className="mt-2 text-sm text-ink-muted">Entradas menos saídas de {monthName}.</p>
            </div>
            <StatTile
              label="Entradas"
              cents={summary.data.income_cents}
              previousCents={summary.data.previous.income_cents}
              previousMonth={summary.data.previous.month}
              goodWhenUp
            />
            <StatTile
              label="Saídas"
              cents={Math.abs(summary.data.expense_cents)}
              previousCents={Math.abs(summary.data.previous.expense_cents)}
              previousMonth={summary.data.previous.month}
              goodWhenUp={false}
            />
          </section>

          {summary.data.uncategorized_count > 0 && (
            <Alert tone="warning">
              {summary.data.uncategorized_count === 1
                ? "1 lançamento deste mês está sem categoria e fica fora dos totais por categoria."
                : `${summary.data.uncategorized_count} lançamentos deste mês estão sem categoria e ficam fora dos totais por categoria.`}
            </Alert>
          )}

          <section className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
            <Card title="Para onde foi o dinheiro" description={`Saídas de ${monthName} por categoria`}>
              {slices.data && <CategorySpendingChart slices={slices.data} />}
            </Card>
            <Card title="Entradas e saídas" description="Últimos 6 meses">
              {trend.data && <MonthlyTrendChart trend={trend.data} />}
            </Card>
          </section>

          <Card title="Orçamentos" description={`Quanto já foi de cada limite em ${monthName}`}>
            {budgets.data?.length ? (
              <div className="grid gap-5 md:grid-cols-2">
                {budgets.data.map((budget) => (
                  <BudgetMeter key={budget.id} budget={budget} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-muted">Nenhum orçamento definido para este mês.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
