/**
 * budgetSchemas.ts - O formato dos orçamentos por categoria
 * # Pra que serve?
 * - Validar o limite de gasto de uma categoria num mês
 * - Descrever o orçamento já com quanto foi gasto e a situação (ok, perto do limite, estourou)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { z } from "zod"
import { CATEGORY_COLOR_SCHEMA } from "./categorySchemas.js"
import { MONTH_SCHEMA } from "./reportSchemas.js"

export const UPSERT_BUDGET_BODY_SCHEMA = z.object({
  category_id: z.uuid("category_id inválido"),
  month: MONTH_SCHEMA,
  limit_cents: z.number().int().min(100, "Limite mínimo é R$ 1,00").max(100_000_000),
})

export const BUDGET_QUERY_SCHEMA = z.object({ month: MONTH_SCHEMA })

export const BUDGET_SCHEMA = z.object({
  id: z.string(),
  month: z.string(),
  category: z.object({ id: z.string(), name: z.string(), color: CATEGORY_COLOR_SCHEMA }),
  limit_cents: z.number().int(),
  // Quanto já saiu nessa categoria no mês (positivo)
  spent_cents: z.number().int(),
  // Negativo quando estourou
  remaining_cents: z.number().int(),
  used_share: z.number(),
  // warning a partir de 80% do limite, over quando passou do limite
  status: z.enum(["ok", "warning", "over"]),
})

export type UpsertBudgetBody = z.infer<typeof UPSERT_BUDGET_BODY_SCHEMA>
export type BudgetQuery = z.infer<typeof BUDGET_QUERY_SCHEMA>
