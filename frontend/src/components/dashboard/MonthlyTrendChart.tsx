import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { formatCompactMoney, formatMoney, formatMonth, formatMonthTitle, formatShortMonth } from "../../lib/format"
import type { MonthTotals } from "../../lib/types"
import { useThemeColors } from "../../lib/useThemeColors"
import { ChartTooltip } from "./ChartTooltip"

interface ChartRow {
  month: string
  label: string
  income: number
  expense: number
}

export function MonthlyTrendChart({ trend }: { trend: MonthTotals[] }) {
  const colors = useThemeColors()

  // Saída entra em módulo: as duas colunas crescem da mesma base
  const rows: ChartRow[] = trend.map((item) => ({
    month: item.month,
    label: formatShortMonth(item.month),
    income: item.income_cents,
    expense: Math.abs(item.expense_cents),
  }))

  const series = [
    { key: "income" as const, name: "Entradas", color: colors.income },
    { key: "expense" as const, name: "Saídas", color: colors.expense },
  ]

  return (
    <div>
      {/* Duas séries: a legenda sempre aparece (a cor sozinha não identifica nada) */}
      <ul className="mb-3 flex flex-wrap gap-4 text-sm text-ink-secondary">
        {series.map((item) => (
          <li key={item.key} className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-sm" style={{ background: item.color }} />
            {item.name}
          </li>
        ))}
      </ul>

      <div className="h-60" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={2} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke={colors.grid} strokeWidth={1} />
            <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: colors.grid }} tick={{ fill: colors.inkMuted, fontSize: 12 }} />
            <YAxis
              width={64}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCompactMoney(Number(value))}
              tick={{ fill: colors.inkMuted, fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: colors.grid, opacity: 0.35 }}
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as ChartRow | undefined
                if (!active || !row) return null
                return (
                  <ChartTooltip
                    title={formatMonthTitle(row.month)}
                    rows={series.map((item) => ({ color: item.color, name: item.name, value: formatMoney(row[item.key]) }))}
                  />
                )
              }}
            />
            {series.map((item) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                name={item.name}
                fill={item.color}
                maxBarSize={24}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <table className="sr-only">
        <caption>Entradas e saídas por mês</caption>
        <thead>
          <tr>
            <th scope="col">Mês</th>
            <th scope="col">Entradas</th>
            <th scope="col">Saídas</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.month}>
              <td>{formatMonth(row.month)}</td>
              <td>{formatMoney(row.income)}</td>
              <td>{formatMoney(row.expense)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
