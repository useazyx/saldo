/**
 * transactionSchemas.ts - O formato dos lançamentos
 * # Pra que serve?
 * - Validar os filtros da listagem, o lançamento manual e a edição
 * - Descrever o lançamento (com conta e categoria juntas) e os totais do filtro
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { z } from "zod"
import { parseDate } from "../utils/statementCsv.js"
import { CATEGORY_COLOR_SCHEMA, CATEGORY_KIND_SCHEMA } from "./categorySchemas.js"

// Data de calendário AAAA-MM-DD que existe de verdade (31/02 não passa)
export const DATE_SCHEMA = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data precisa estar no formato AAAA-MM-DD")
  .refine((value) => parseDate(value) === value, "Essa data não existe no calendário")

export const LIST_TRANSACTIONS_QUERY_SCHEMA = z.object({
  account_id: z.uuid("account_id inválido").optional(),
  // "none" busca o que ainda está sem categoria
  category_id: z.union([z.uuid("category_id inválido"), z.literal("none")]).optional(),
  kind: z.enum(["income", "expense"]).optional(),
  from: DATE_SCHEMA.optional(),
  to: DATE_SCHEMA.optional(),
  search: z.string().trim().max(60).optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(200).default(50),
})

export const CREATE_TRANSACTION_BODY_SCHEMA = z.object({
  account_id: z.uuid("account_id inválido"),
  occurred_on: DATE_SCHEMA,
  description: z.string().trim().min(2, "Descrição precisa de pelo menos 2 letras").max(120),
  // Negativo é saída, positivo é entrada
  amount_cents: z
    .number()
    .int("Valor em centavos, sem vírgula")
    .refine((value) => value !== 0, "Valor não pode ser zero"),
  category_id: z.uuid("category_id inválido").nullish(),
  notes: z.string().trim().max(300).nullish(),
})

export const UPDATE_TRANSACTION_BODY_SCHEMA = z
  .object({
    description: z.string().trim().min(2).max(120),
    category_id: z.uuid("category_id inválido").nullable(),
    notes: z.string().trim().max(300).nullable(),
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, "Manda pelo menos um campo pra alterar")

export const TRANSACTION_SCHEMA = z.object({
  id: z.string(),
  occurred_on: z.string(),
  description: z.string(),
  amount_cents: z.number().int(),
  notes: z.string().nullable(),
  account: z.object({ id: z.string(), name: z.string() }),
  category: z
    .object({ id: z.string(), name: z.string(), color: CATEGORY_COLOR_SCHEMA, kind: CATEGORY_KIND_SCHEMA })
    .nullable(),
})

export const TRANSACTION_LIST_RESPONSE_SCHEMA = z.object({
  transactions: z.array(TRANSACTION_SCHEMA),
  total: z.number().int(),
  current_page: z.number().int(),
  total_pages: z.number().int(),
  totals: z.object({
    income_cents: z.number().int(),
    expense_cents: z.number().int(),
    net_cents: z.number().int(),
  }),
})

export type ListTransactionsQuery = z.infer<typeof LIST_TRANSACTIONS_QUERY_SCHEMA>
export type CreateTransactionBody = z.infer<typeof CREATE_TRANSACTION_BODY_SCHEMA>
export type UpdateTransactionBody = z.infer<typeof UPDATE_TRANSACTION_BODY_SCHEMA>
