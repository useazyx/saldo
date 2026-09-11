import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { formatMoney, formatPercent } from "../../lib/format"
import type { CategorySlice } from "../../lib/types"
import { colorForCategory, useThemeColors } from "../../lib/useThemeColors"
import { ChartTooltip } from "./ChartTooltip"

// Até 7 categorias com cor própria; o resto vira uma barra "Outras" (nunca uma cor inventada)
const MAX_NAMED = 7
const ROW_HEIGHT = 36

interface ChartRow {
  key: string
  label: string
  total_cents: number
  share: number
  fill: string
}

function toRows(slices: CategorySlice[], colors: ReturnType<typeof useThemeColors>): ChartRow[] {
  const named = slices.slice(0, MAX_NAMED).map((slice) => ({
    key: slice.category?.id ?? "none",
    label: slice.category?.name ?? "Sem categoria",
    total_cents: slice.total_cents,
    share: slice.share,
    fill: colorForCategory(colors, slice.category?.color),
  }))

  const rest = slices.slice(MAX_NAMED)
  if (rest.length === 0) return named

  return [
    ...named,
    {
      key: "others",
      label: "Outras",
      total_cents: rest.reduce((total, slice) => total + slice.total_cents, 0),
      share: rest.reduce((total, slice) => total + slice.share, 0),
      fill: colors.none,
    },
  ]
}

export function CategorySpendingChart({ slices }: { slices: CategorySlice[] }) {
  const colors = useThemeColors()
  const rows = toRows(slices, colors)

  if (rows.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-muted">Nenhuma saída neste mês.</p>
  }

  return (
    <div>
      <div style={{ height: rows.length * ROW_HEIGHT + 8 }} aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 96, bottom: 0, left: 0 }} barCategoryGap={8}>
            <XAxis type="number" hide domain={[0, "dataMax"]} />
            <YAxis
              type="category"
              dataKey="label"
              width={150}
              tickLine={false}
              axisLine={false}
              tick={{ fill: colors.inkSecondary, fontSize: 13 }}
            />
            <Tooltip
              cursor={{ fill: colors.grid, opacity: 0.4 }}
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as ChartRow | undefined
                if (!active || !row) return null
                return (
                  <ChartTooltip
                    rows={[{ color: row.fill, name: `${row.label} · ${formatPercent(row.share)}`, value: formatMoney(row.total_cents) }]}
                  />
                )
              }}
            />
            {/* Barra fina (20px), quadrada na base e arredondada na ponta, com o valor logo depois */}
            <Bar dataKey="total_cents" barSize={20} radius={[0, 4, 4, 0]} isAnimationActive={false}>
              {rows.map((row) => (
                <Cell key={row.key} fill={row.fill} />
              ))}
              <LabelList
                dataKey="total_cents"
                position="right"
                offset={8}
                formatter={(value) => formatMoney(Number(value))}
                style={{ fill: colors.ink, fontSize: 13, fontVariantNumeric: "tabular-nums" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* A mesma informação em tabela, pra leitor de tela */}
      <table className="sr-only">
        <caption>Saídas por categoria</caption>
        <thead>
          <tr>
            <th scope="col">Categoria</th>
            <th scope="col">Total</th>
            <th scope="col">Parte do mês</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td>{row.label}</td>
              <td>{formatMoney(row.total_cents)}</td>
              <td>{formatPercent(row.share)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
