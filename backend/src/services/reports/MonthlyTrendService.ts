/**
 * MonthlyTrendService.ts - Entradas, saídas e saldo mês a mês
 * # Pra que serve?
 * - Somar tudo por mês direto no banco (uma consulta só, e não trazer os lançamentos pra somar aqui)
 * - Devolver todos os meses do período em ordem, inclusive os que não tiveram movimento (com zero)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { prisma } from "../../config/prisma.js"
import { listMonths, monthRange } from "../../utils/month.js"

// O que volta do SQL (SUM no Postgres vem como bigint)
interface MonthTotalsRow {
  month: string
  income_cents: bigint | null
  expense_cents: bigint | null
}

export class MonthlyTrendService {
  async execute(userId: string, until: string, count: number) {
    const months = listMonths(until, count)
    const start = monthRange(months[0]).start
    const end = monthRange(until).end

    // $queryRaw com template: os valores viram parâmetros, então não tem como injetar SQL
    const rows = await prisma.$queryRaw<MonthTotalsRow[]>`
      SELECT
        to_char(date_trunc('month', occurred_on), 'YYYY-MM') AS month,
        SUM(CASE WHEN amount_cents > 0 THEN amount_cents ELSE 0 END) AS income_cents,
        SUM(CASE WHEN amount_cents < 0 THEN amount_cents ELSE 0 END) AS expense_cents
      FROM transactions
      WHERE user_id = ${userId} AND occurred_on >= ${start} AND occurred_on < ${end}
      GROUP BY 1
    `

    const totalsByMonth = new Map(rows.map((row) => [row.month, row]))

    return months.map((month) => {
      const row = totalsByMonth.get(month)
      const income = Number(row?.income_cents ?? 0)
      const expense = Number(row?.expense_cents ?? 0)
      return { month, income_cents: income, expense_cents: expense, net_cents: income + expense }
    })
  }
}
