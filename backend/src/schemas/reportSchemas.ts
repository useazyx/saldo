/**
 * reportSchemas.ts - O formato dos relatórios
 * # Pra que serve?
 * - Validar o mês pedido e quantos meses entram na evolução
 * - Descrever o resumo do mês, os gastos por categoria e a evolução mês a mês
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { z } from "zod"
import { MONTH_REGEX } from "../utils/month.js"
import { CATEGORY_COLOR_SCHEMA } from "./categorySchemas.js"

export const MONTH_SCHEMA = z.string().regex(MONTH_REGEX, "Mês precisa estar no formato AAAA-MM")

export const MONTH_QUERY_SCHEMA = z.object({ month: MONTH_SCHEMA })

export const BY_CATEGORY_QUERY_SCHEMA = z.object({
  month: MONTH_SCHEMA,
  kind: z.enum(["income", "expense"]).default("expense"),
})

export const TREND_QUERY_SCHEMA = z.object({
  until: MONTH_SCHEMA,
  months: z.coerce.number().int().min(1).max(24).default(6),
})

const TOTALS = {
  income_cents: z.number().int(),
  expense_cents: z.number().int(),
  net_cents: z.number().int(),
}

export const MONTH_SUMMARY_SCHEMA = z.object({
  month: z.string(),
  ...TOTALS,
  previous: z.object({ month: z.string(), ...TOTALS }),
  uncategorized_count: z.number().int(),
})

export const CATEGORY_SPENDING_SCHEMA = z.array(
  z.object({
    // null = lançamentos sem categoria
    category: z.object({ id: z.string(), name: z.string(), color: CATEGORY_COLOR_SCHEMA }).nullable(),
    // Sempre positivo: é o tamanho da fatia, entrada ou saída
    total_cents: z.number().int(),
    share: z.number(),
    transactions_count: z.number().int(),
  })
)

export const MONTHLY_TREND_SCHEMA = z.array(z.object({ month: z.string(), ...TOTALS }))

export type MonthQuery = z.infer<typeof MONTH_QUERY_SCHEMA>
export type ByCategoryQuery = z.infer<typeof BY_CATEGORY_QUERY_SCHEMA>
export type TrendQuery = z.infer<typeof TREND_QUERY_SCHEMA>
